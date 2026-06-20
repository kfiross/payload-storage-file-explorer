import type { Config, PayloadRequest } from 'payload';
import type { AfterDeleteHook, AfterUploadHook, BeforeDeleteHook, BeforeUploadHook, ExplorerAccessFn, S3ExplorerPluginOptions, StorageAdapterOptions } from './types/index.js';
export type PayloadStorageFileExplorerConfig = {
    adapterOptions: StorageAdapterOptions;
    /**
     * The admin route where the explorer will be mounted.
     * @default '/explorer'
     */
    adminRoute?: string;
    /**
     * Whether to disable the plugin. This keeps the plugin from registering any admin routes or API endpoints.
     */
    disabled?: boolean;
    /**
     * Whether to allow deleting files from S3.
     * @default true
     */
    enableDelete?: boolean;
    /**
     * Whether to show file download / presigned URL button.
     * @default true
     */
    enableDownload?: boolean;
    /**
     * Whether to allow creating new "folders" (zero-byte prefix objects).
     * @default true
     */
    enableFolderCreate?: boolean;
    /**
     * Whether to allow uploading new files.
     * @default true
     */
    enableUpload?: boolean;
    /**
     * Max file size for uploads in bytes.
     * @default 104857600 (100 MB)
     */
    maxUploadSize?: number;
    /**
     * Label shown in the Payload admin sidebar navigation.
     * @default 'File Explorer'
     */
    navigationLabel?: string;
    /**
     * Presigned URL expiry in seconds for file downloads / previews.
     * @default 3600
     */
    presignedUrlExpiry?: number;
    /**
     * Optional root prefix to scope the explorer to a subfolder.
     * E.g. 'media/' will start navigation inside s3://bucket/media/
     * @default ''
     */
    rootPrefix?: string;
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
        req: PayloadRequest;
    }) => string | Promise<string>;
    /**
     * Access control callbacks.
     * Return true to allow the action.
     */
    access?: {
        canList?: ExplorerAccessFn;
        canDownload?: ExplorerAccessFn;
        canUpload?: ExplorerAccessFn;
        canDelete?: ExplorerAccessFn;
        canCreateFolder?: ExplorerAccessFn;
    };
    /**
     * Lifecycle hooks.
     */
    hooks?: {
        beforeUpload?: BeforeUploadHook;
        afterUpload?: AfterUploadHook;
        beforeDelete?: BeforeDeleteHook;
        afterDelete?: AfterDeleteHook;
    };
    /**
     * Title shown in the Payload page title of the explorer.
     * @default 'S3 File Explorer'
     */
    pageTitle?: string;
    /**
     * Allowed MIME types for uploads.
     * Example: ['image/jpeg', 'image/png', 'application/zip']
     * If not provided, defaults to all types.
     */
    allowedMimeTypes?: string[];
    /**
     * Allowed file extensions.
     * Example: ['.zip', '.jpg', '.pdf']
     */
    allowedExtensions?: string[];
};
export declare const payloadStorageFileExplorer: (pluginOptions: PayloadStorageFileExplorerConfig) => (config: Config) => Config;
export declare function s3ExplorerPluginOptions(options: S3ExplorerPluginOptions): S3ExplorerPluginOptions;
