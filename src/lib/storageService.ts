import type { PresignedUploadResult } from '../types/index.js'

export abstract class StorageService<T> {
  async listObjects(
    bucket: string,
    prefix: string,
    continuationToken?: string,
  ): Promise<T> {
    throw new Error('Not implemented')
  }

  async getDownloadUrl(
    bucket: string,
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    throw new Error('Not implemented')
  }

  async createUploadPost(
    bucket: string,
    key: string,
    options: {
      allowedMimeTypes?: '*' | string[]
      expiresIn?: number
      maxSizeBytes?: number
    } = {},
  ): Promise<PresignedUploadResult> {
    throw new Error('Not implemented')
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async deletePrefix(bucket: string, prefix: string): Promise<{ deleted: number }> {
    throw new Error('Not implemented')
  }

  async createFolder(bucket: string, folderKey: string): Promise<void> {
    throw new Error('Not implemented')
  }
}

