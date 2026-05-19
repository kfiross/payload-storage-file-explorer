import type { Config } from 'payload';
import type { S3ExplorerPluginOptions, StorageAdapterOptions } from './types/index.js';
export type PayloadStorageFileExplorerConfig = {
    adapterOptions: StorageAdapterOptions;
    /**
     * The admin route where the explorer will be mounted.
     * @default '/explorer'
     */
    adminRoute?: string;
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
};
export declare const payloadStorageFileExplorer: (pluginOptions: PayloadStorageFileExplorerConfig) => (config: Config) => Config;
export declare function s3ExplorerPluginOptions(options: S3ExplorerPluginOptions): S3ExplorerPluginOptions;
