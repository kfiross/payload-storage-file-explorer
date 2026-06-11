import { S3ExplorerPluginOptions } from "src/types/index.js"
import { S3Service } from "./s3Service.js"
import { StorageService } from "./storageService.js"

export const storageServiceFactory = (options: S3ExplorerPluginOptions): StorageService<any> => {
  switch (options.storageType) {
    case 's3':
      return new S3Service(options)
    default:
      throw new Error(`Unsupported storage type: ${options.storageType}`)
  }
}