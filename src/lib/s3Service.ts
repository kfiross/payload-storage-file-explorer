import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import type {
  PresignedUploadResult,
  S3ExplorerPluginOptions,
  S3Folder,
  S3ListResult,
  S3Object,
} from '../types/index.js'
import { StorageService } from './storageService.js'

export class S3Service extends StorageService<S3ListResult> {
  readonly client: S3Client

  constructor(options: S3ExplorerPluginOptions) {
    super()
    const config: S3ClientConfig = {
      region: options.region,
    }

    if (options.credentials) {
      config.credentials = {
        accessKeyId: options.credentials.accessKeyId,
        secretAccessKey: options.credentials.secretAccessKey,
      }
    }

    if (options.endpoint) {
      config.endpoint = options.endpoint
    }

    if (options.forcePathStyle) {
      config.forcePathStyle = true
    }

    this.client = new S3Client(config)
  }

  /**
   * List objects at a given prefix, splitting into folders and files.
   */
  async listObjects(
    bucket: string,
    prefix = '',
    continuationToken?: string,
  ): Promise<S3ListResult> {
    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: '/',
        MaxKeys: 200,
        ContinuationToken: continuationToken,
      }),
    )

    const folderStats = await Promise.all(
      (response.CommonPrefixes ?? []).map((folder) =>
        this.getFolderInfo(bucket, folder.Prefix!),
      ),
    )

    const folders: S3Folder[] = (response.CommonPrefixes ?? [])
      .filter((p) => p.Prefix && p.Prefix !== prefix)
      .map((p, index) => ({
        isFolder: true,
        name: p.Prefix!.replace(prefix, '').replace(/\/$/, ''),
        prefix: p.Prefix!,
        size: folderStats[index].size,
        lastModified: folderStats[index].lastModified,
      }))

    const files: S3Object[] = (response.Contents ?? [])
      .filter((obj) => obj.Key && obj.Key !== `${prefix}.emptyFolderPlaceholder`)
      .map((obj) => ({
        isFolder: false,
        key: obj.Key!,
        size: obj.Size ?? 0,
        etag: obj.ETag?.replace(/"/g, ''),
        lastModified: obj.LastModified ?? new Date(),
      }))

    return {
      prefix,
      folders,
      files,
      isTruncated: response.IsTruncated ?? false,
      nextContinuationToken: response.NextContinuationToken,
    }
  }

  /**
   * Get a presigned download URL for a single object.
   */
  async getDownloadUrl(
    bucket: string,
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    await this.client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )

    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      { expiresIn },
    )
  }

  /**
   * Generate a presigned POST for direct browser → S3 upload.
   * Using POST (vs PUT) gives us size/type constraints server-side.
   */
  async createUploadPost(
    bucket: string,
    key: string,
    options: {
      allowedMimeTypes?: '*' | string[]
      expiresIn?: number
      maxSizeBytes?: number
    } = {},
  ): Promise<PresignedUploadResult> {
    const {
      allowedMimeTypes = '*',
      expiresIn = 600,
      maxSizeBytes = 50 * 1024 * 1024,
    } = options

    const conditions: Parameters<typeof createPresignedPost>[1]['Conditions'] = [
      ['content-length-range', 0, maxSizeBytes],
    ]

    if (Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0) {
      conditions.push([
        'starts-with',
        '$Content-Type',
        allowedMimeTypes[0].replace(/\/.+/, '/'),
      ])
    }

    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn,
      Conditions: conditions,
    })

    return {
      url,
      fields,
      key,
    }
  }

   /**
   * Delete a single S3 object.
   */
  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )
  }

  /**
   * Recursively delete all objects under a prefix (i.e., delete a "folder").
   */
  async deletePrefix(
    bucket: string,
    prefix: string,
  ): Promise<{ deleted: number }> {
    let deleted = 0
    let continuationToken: string | undefined

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        }),
      )

      const objects =
        response.Contents?.map((obj) => ({
          Key: obj.Key!,
        })) ?? []

      if (objects.length) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: objects,
              Quiet: true,
            },
          }),
        )

        deleted += objects.length
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return { deleted }
  }

  /**
   * Create a "folder" placeholder object in S3.
   * S3 has no real folders — a zero-byte key ending in "/" is the convention.
   */
  async createFolder(bucket: string, folderKey: string): Promise<void> {
    const key = folderKey.endsWith('/')
      ? folderKey
      : `${folderKey}/`

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: '',
        ContentLength: 0,
      }),
    )
  }

  /**
   * Format bytes to human-readable string.
   */
  formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) {
      return '0 B'
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.floor(Math.log(bytes) / Math.log(1024))

    return `${parseFloat(
      (bytes / Math.pow(1024, index)).toFixed(decimals),
    )} ${units[index]}`
  }

  /**
   * Derive a file's MIME type from its extension.
   */
  getMimeType(key: string): string {
    const ext = key.split('.').pop()?.toLowerCase() ?? ''

    return MIME_TYPES[ext] ?? 'application/octet-stream'
  }

  /**
   * Is this key an image we can preview inline?
   */
  isPreviewable(key: string): boolean {
    const ext = key.split('.').pop()?.toLowerCase() ?? ''

    return PREVIEWABLE_EXTENSIONS.includes(ext)
  }

  /**
   * Build breadcrumb segments from a prefix string.
   */
  buildBreadcrumbs(prefix: string) {
    const breadcrumbs = [
      {
        label: 'Root',
        prefix: '',
      },
    ]

    if (!prefix) {
      return breadcrumbs
    }

    const parts = prefix.replace(/\/$/, '').split('/')

    parts.forEach((part, index) => {
      breadcrumbs.push({
        label: part,
        prefix: `${parts.slice(0, index + 1).join('/')}/`,
      })
    })

    return breadcrumbs
  }

  /**
   * Calculate aggregated folder metadata.
   */
  private async getFolderInfo(
    bucket: string,
    prefix: string,
  ): Promise<{ size: number; lastModified?: Date }> {
    let size = 0
    let lastModified: Date | undefined
    let continuationToken: string | undefined

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          Delimiter: '/',
          MaxKeys: 200,
          ContinuationToken: continuationToken,
        }),
      )

      for (const object of response.Contents ?? []) {
        size += object.Size ?? 0

        if (
          object.LastModified &&
          (!lastModified || object.LastModified > lastModified)
        ) {
          lastModified = object.LastModified
        }
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined
    } while (continuationToken)

    return {
      size,
      lastModified,
    }
  }
}

const PREVIEWABLE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'svg',
  'webp',
  'ico',
]

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  json: 'application/json',
  csv: 'text/csv',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  zip: 'application/zip',
}