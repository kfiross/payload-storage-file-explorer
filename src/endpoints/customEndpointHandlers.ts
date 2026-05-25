/**
 * Payload-native endpoint handlers.
 *
 * These are wired directly into Payload's `endpoints` config array by the
 * plugin — no Next.js API route files needed from the user.
 *
 * Each factory returns a Payload `PayloadHandler` which receives the standard
 * Web API `Request` and returns a `Response`.  Payload v3 registers these on
 * its own router at  /api/<slug>  (custom endpoints) or at a top-level custom
 * path via the `endpoints` array on the root Config.
 */
import type { PayloadHandler, PayloadRequest } from 'payload'

import type { PayloadStorageFileExplorerConfig } from '../index.js'

import {
  createPresignedUploadPost,
  createS3Client,
  createS3Folder,
  deleteS3Object,
  deleteS3Prefix,
  getPresignedDownloadUrl,
  listS3Objects,
} from '../lib/s3Service.js'

// ─── helpers ─────────────────────────────────────────────────────────────────

function json<T>(data: T, status = 200): Response {
  return Response.json(data, { status })
}

async function resolveStoragePath({
  req,
  options,
  searchParams,
  prefix,
}: {
  req: PayloadRequest
  options: PayloadStorageFileExplorerConfig
  searchParams?: URLSearchParams
  prefix?: string,
}) {
  const keyFromQuery = searchParams?.get('key') ?? undefined
  const prefixFromQuery = searchParams?.get('prefix') ?? prefix ?? ''

  const dynamicRootPrefix =
    await options.resolveRootPrefix?.({ req })

  const rootPrefix =
    dynamicRootPrefix ??
    options.rootPrefix ??
    ''

  const normalizedRootPrefix = rootPrefix.endsWith('/')
    ? rootPrefix
    : rootPrefix
      ? `${rootPrefix}/`
      : ''

  /**
   * if key → it's an action on an existing file (download/delete etc.)
   */
  if (keyFromQuery) {
    const safeKey = keyFromQuery.startsWith(normalizedRootPrefix)
      ? keyFromQuery
      : `${normalizedRootPrefix}${keyFromQuery}`

    return {
      key: safeKey,
      prefix: safeKey.substring(0, safeKey.lastIndexOf('/') + 1),
      rootPrefix: normalizedRootPrefix,
    }
  }

  /**
   *  if no key → it's navigation / upload context
   */
  const safePrefix = prefixFromQuery.startsWith(normalizedRootPrefix)
    ? prefixFromQuery
    : normalizedRootPrefix

  const normalizedPrefix = safePrefix.endsWith('/')
    ? safePrefix
    : safePrefix
      ? `${safePrefix}/`
      : ''

  return {
    key: undefined,
    prefix: normalizedPrefix,
    rootPrefix: normalizedRootPrefix,
  }
}

// ─── list ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/s3-explorer/list?prefix=some/path/&token=<continuationToken>
 * Returns { success, data: S3ListResult }
 */
export function makeListHandler(options: PayloadStorageFileExplorerConfig): PayloadHandler {
  const { adapterOptions } = options
  return async (req) => {
    if (adapterOptions.storageType !== 's3') {
      throw new Error(`storageType '${adapterOptions.storageType}' is not supported `)
    }

    try {
      const url = new URL(req.url!)
      const continuationToken = url.searchParams.get('token') ?? undefined

      const { prefix: safePrefix } = await resolveStoragePath({
        req,
        options,
        searchParams: url.searchParams,
      })

      if(options.access?.canList && !(await options.access?.canList?.({req, prefix: safePrefix}))) {
        return json({ error: 'Forbidden', success: false }, 403)
      }

      const client = createS3Client(adapterOptions)
      const result = await listS3Objects(
        client,
        adapterOptions.bucket,
        safePrefix,
        continuationToken,
      )

      return json({ data: result, success: true })
    } catch (err: unknown) {
      return json(
        { error: err instanceof Error ? err.message : 'Unknown error', success: false },
        500,
      )
    }
  }
}

// ─── upload (presign) ─────────────────────────────────────────────────────────

/**
 * POST /api/s3-explorer/upload
 * Body: { prefix, filename, contentType }
 * Returns { success, data: { url, fields, key } }  — client POSTs directly to S3.
 */
export function makeUploadHandler(options: PayloadStorageFileExplorerConfig): PayloadHandler {
  const { adapterOptions } = options
  return async (req) => {
    if (adapterOptions.storageType !== 's3') {
      throw new Error(`storageType '${adapterOptions.storageType}' is not supported `)
    }

    if (!(options.enableUpload ?? true)) {
      return json({ error: 'Uploads are disabled', success: false }, 403)
    }

    try {
      // @ts-ignore
      const body = (await req.json()) as {
        contentType?: string
        filename?: string
        prefix?: string
      }
      const { filename, prefix } = body

      if (!filename) {
        return json({ error: 'filename is required', success: false }, 400)
      }

      const { prefix: safePrefix } = await resolveStoragePath({
        req,
        options,
        prefix,
      })
      const key = `${safePrefix}${filename}`

      if(options.access?.canUpload && !(await options.access?.canUpload?.({req, key, prefix: safePrefix}))) {
        return json({ error: 'Forbidden', success: false }, 403)
      }

      const client = createS3Client(adapterOptions)
      const result = await createPresignedUploadPost(client, adapterOptions.bucket, key, {
        allowedMimeTypes: adapterOptions.allowedMimeTypes,
        expiresIn: 600,
        maxSizeBytes: options.maxUploadSize,
      })

      return json({ data: result, success: true })
    } catch (err: unknown) {
      return json(
        { error: err instanceof Error ? err.message : 'Unknown error', success: false },
        500,
      )
    }
  }
}

// ─── delete ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/s3-explorer/delete
 * Body: { key } for a single file  OR  { prefix } for an entire folder (recursive).
 * Returns { success, data: { key } | { deleted: number } }
 */
export function makeDeleteHandler(options: PayloadStorageFileExplorerConfig): PayloadHandler {
  const { adapterOptions } = options
  return async (req) => {
    if (adapterOptions.storageType !== 's3') {
      throw new Error(`storageType '${adapterOptions.storageType}' is not supported `)
    }

    if (!(options.enableDelete ?? true)) {
      return json({ error: 'Deletes are disabled', success: false }, 403)
    }

    try {
      // @ts-ignore
      const body = (await req.json()) as { key?: string; prefix?: string }
      const { key, prefix } = body
      const client = createS3Client(adapterOptions)

      if (prefix) {
        const { prefix: safePrefix, rootPrefix } = await resolveStoragePath({
          req,
          options,
          prefix,
        })

        if(options.access?.canDelete && !(await options.access?.canDelete?.({req, prefix: safePrefix}))) {
          return json({ error: 'Forbidden', success: false }, 403)
        }

        // NOTE: Ensures user cannot delete everything if prefix is modified to bypass rootPrefix boundaries
        if (rootPrefix && (!safePrefix.startsWith(rootPrefix) || safePrefix === rootPrefix)) {
          return json({ error: 'Access denied', success: false }, 403)
        }

        const { deleted } = await deleteS3Prefix(client, adapterOptions.bucket, safePrefix)
        return json({ data: { deleted }, success: true })
      }

      if (key) {
        const searchParams = new URLSearchParams()
        searchParams.set('key', key)

        const { key: safeKey, rootPrefix } = await resolveStoragePath({
          req,
          options,
          searchParams,
        })

        if (!safeKey || (rootPrefix && !safeKey.startsWith(rootPrefix))) {
          return json({ error: 'Access denied', success: false }, 403)
        }

        if(options.access?.canDelete && !(await options.access?.canDelete?.({req, key: safeKey}))) {
          return json({ error: 'Forbidden', success: false }, 403)
        }

        await deleteS3Object(client, adapterOptions.bucket, safeKey!)
        return json({ data: { key: safeKey }, success: true })
      }

      return json({ error: 'key or prefix is required', success: false }, 400)
    } catch (err: unknown) {
      return json(
        { error: err instanceof Error ? err.message : 'Unknown error', success: false },
        500,
      )
    }
  }
}

// ─── folder create ────────────────────────────────────────────────────────────

/**
 * POST /api/s3-explorer/folder
 * Body: { prefix, name }
 * Returns { success, data: { folderKey } }
 */
export function makeFolderHandler(options: PayloadStorageFileExplorerConfig): PayloadHandler {
  const { adapterOptions } = options
  if (adapterOptions.storageType !== 's3') {
    throw new Error(`storageType '${adapterOptions.storageType}' is not supported `)
  }

  return async (req) => {
    if (!(options.enableFolderCreate ?? true)) {
      return json({ error: 'Folder creation is disabled', success: false }, 403)
    }

    try {
      // @ts-ignore
      const body = (await req.json()) as { name?: string; prefix?: string }
      const { name, prefix } = body

      if (!name) {
        return json({ error: 'name is required', success: false }, 400)
      }

      if (!/^[\w\-. ]+$/.test(name)) {
        return json({ error: 'Folder name contains invalid characters', success: false }, 400)
      }

      const { prefix: safePrefix } = await resolveStoragePath({
        req,
        options,
        prefix,
      })

      
      const folderKey = `${safePrefix}${name}/`

      if(options.access?.canCreateFolder && !(await options.access?.canCreateFolder?.({req, prefix: safePrefix, key: folderKey}))) {
          return json({ error: 'Forbidden', success: false }, 403)
      }

      const client = createS3Client(adapterOptions)
      await createS3Folder(client, adapterOptions.bucket, folderKey)

      return json({ data: { folderKey }, success: true })
    } catch (err: unknown) {
      console.warn({ err })
      return json(
        { error: err instanceof Error ? err.message : 'Unknown error', success: false },
        500,
      )
    }
  }
}

// ─── download (presign) ───────────────────────────────────────────────────────

/**
 * GET /api/s3-explorer/download?key=some/path/file.jpg
 * Returns { success, data: { url, key } }  — presigned GET URL.
 */
export function makeDownloadHandler(options: PayloadStorageFileExplorerConfig): PayloadHandler {
  const { adapterOptions } = options
  return async (req) => {
    if (adapterOptions.storageType !== 's3') {
      throw new Error(`storageType '${adapterOptions.storageType}' is not supported `)
    }

    if (!(options.enableDownload ?? true)) {
      return json({ error: 'Downloads are disabled', success: false }, 403)
    }

    try {
      const url = new URL(req.url!)
      const keyFromQuery = url.searchParams.get('key')

      if (!keyFromQuery) {
        return json({ error: 'key is required', success: false }, 400)
      }

      const { key: safeKey, rootPrefix } = await resolveStoragePath({
        req,
        options,
        searchParams: url.searchParams,
      })

      if (rootPrefix && !safeKey!.startsWith(rootPrefix)) {
        return json({ error: 'Access denied', success: false }, 403)
      }

      const client = createS3Client(adapterOptions)
      const presignedUrl = await getPresignedDownloadUrl(
        client,
        adapterOptions.bucket,
        safeKey!,
        options.presignedUrlExpiry ?? 3600,
      )

      return json({ data: { key: safeKey, url: presignedUrl }, success: true })
    } catch (err: unknown) {
      return json(
        { error: err instanceof Error ? err.message : 'Unknown error', success: false },
        500,
      )
    }
  }
}