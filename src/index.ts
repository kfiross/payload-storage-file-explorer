import type { Config, Endpoint, PayloadRequest } from 'payload'

import type { 
  AfterDeleteHook,
  AfterUploadHook,
  BeforeDeleteHook,
  BeforeUploadHook,
  ExplorerAccessFn,
  S3ExplorerPluginOptions,
  StorageAdapterOptions 
} from './types/index.js'

import {
  makeDeleteHandler,
  makeDownloadHandler,
  makeFolderHandler,
  makeListHandler,
  makeUploadHandler,
} from './endpoints/customEndpointHandlers.js'

export type PayloadStorageFileExplorerConfig = {
  adapterOptions: StorageAdapterOptions
  /**
   * The admin route where the explorer will be mounted.
   * @default '/explorer'
   */
  adminRoute?: string

  /**
   * Whether to disable the plugin. This keeps the plugin from registering any admin routes or API endpoints.
   */
  disabled?: boolean

  /**
   * Whether to allow deleting files from S3.
   * @default true
   */
  enableDelete?: boolean

  /**
   * Whether to show file download / presigned URL button.
   * @default true
   */
  enableDownload?: boolean

  /**
   * Whether to allow creating new "folders" (zero-byte prefix objects).
   * @default true
   */
  enableFolderCreate?: boolean

  /**
   * Whether to allow uploading new files.
   * @default true
   */
  enableUpload?: boolean

  /**
   * Max file size for uploads in bytes.
   * @default 104857600 (100 MB)
   */
  maxUploadSize?: number

  /**
   * Label shown in the Payload admin sidebar navigation.
   * @default 'File Explorer'
   */
  navigationLabel?: string

  /**
   * Presigned URL expiry in seconds for file downloads / previews.
   * @default 3600
   */
  presignedUrlExpiry?: number

  /**
   * Optional root prefix to scope the explorer to a subfolder.
   * E.g. 'media/' will start navigation inside s3://bucket/media/
   * @default ''
   */
  rootPrefix?: string

  /**
   * Dynamically resolve the root prefix per request/user.
   *
   * Useful for:
   * - multi tenant isolation
   * - per-user directories
   * - RBAC scoped storage access
   *
   * Example:
   * resolveRootPrefix: ({ req }) => `tenants/${req.user?.tenantId}/`
   */
  resolveRootPrefix?: (args: {
    req: PayloadRequest
  }) => string | Promise<string>

  /**
   * Access control callbacks.
   * Return true to allow the action.
   */
  access?: {
    canList?: ExplorerAccessFn
    canDownload?: ExplorerAccessFn
    canUpload?: ExplorerAccessFn
    canDelete?: ExplorerAccessFn
    canCreateFolder?: ExplorerAccessFn
  }

  /**
   * Lifecycle hooks.
   */
  hooks?: {
    beforeUpload?: BeforeUploadHook
    afterUpload?: AfterUploadHook

    beforeDelete?: BeforeDeleteHook
    afterDelete?: AfterDeleteHook
  }

  /**
   * Title shown in the Payload page title of the explorer.
   * @default 'S3 File Explorer'
   */
  pageTitle?: string

  /**
   * Allowed MIME types for uploads.
   * Example: ['image/jpeg', 'image/png', 'application/zip']
   * If not provided, defaults to all types.
   */
  allowedMimeTypes?: string[]

  /**
   * Allowed file extensions. 
   * Example: ['.zip', '.jpg', '.pdf']
   */
  allowedExtensions?: string[]
}

const apiBasePath = '/api/file-explorer'

export const payloadStorageFileExplorer = (pluginOptions: PayloadStorageFileExplorerConfig) => {
  return (config: Config): Config => {
    const adminRoute = pluginOptions.adminRoute ?? '/explorer'

    if (!config.collections) {
      config.collections = []
    }

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }

    if (!config.endpoints) {
      config.endpoints = []
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    if (!config.admin.components.views) {
      config.admin.components.views = {}
    }

    if (!config.admin.custom) {
      config.admin.custom = {}
    }

    config.admin.custom.s3FileExplorer = {
      apiBasePath,
      options: pluginOptions,
    }

    if (pluginOptions.adapterOptions.storageType === 's3') {
      config.admin.components.views.s3FileExplorer = {
        // Payload v3 resolves this as a module#exportName path.
        // The RSC wrapper reads plugin options from config.custom
        // so no secrets end up in the client bundle.
        Component: '@kfiross44/payload-storage-file-explorer/rsc#S3ExplorerViewServer',
        meta: {
          description: `Browse S3 bucket: ${pluginOptions.adapterOptions.bucket}`,
          title: pluginOptions.navigationLabel ?? 'File Explorer',
        },
        serverProps: {
          apiBasePath,
          options: pluginOptions,
        },
        //@ts-ignore
        path: adminRoute,
      }
    }

    const explorerEndpoints: Endpoint[] = [
      {
        handler: makeListHandler(pluginOptions),
        method: 'get',
        path: '/file-explorer/list',
      },
      {
        handler: makeDownloadHandler(pluginOptions),
        method: 'get',
        path: '/file-explorer/download',
      },
      {
        handler: makeUploadHandler(pluginOptions),
        method: 'post',
        path: '/file-explorer/upload',
      },
      {
        handler: makeFolderHandler(pluginOptions),
        method: 'post',
        path: '/file-explorer/folder',
      },
      {
        handler: makeDeleteHandler(pluginOptions),
        method: 'delete',
        path: '/file-explorer/delete',
      },
    ]

    config.endpoints.push(...explorerEndpoints)

    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // Ensure we are executing any existing onInit functions before running our own.
      if (incomingOnInit) {
        await incomingOnInit(payload)
      }
    }

    return config
  }
}

export function s3ExplorerPluginOptions(options: S3ExplorerPluginOptions): S3ExplorerPluginOptions {
  return {
    ...options,
  }
}
