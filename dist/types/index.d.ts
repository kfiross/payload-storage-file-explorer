export type StorageFileExplorerAdapterOptions<T extends string = string> = {
    storageType: T;
};
export type StorageAdapterOptions = S3ExplorerPluginOptions | VercelBlobExplorerOptions;
type VercelBlobExplorerOptions = StorageFileExplorerAdapterOptions<'vercel'>;
export interface S3ExplorerPluginOptions extends StorageFileExplorerAdapterOptions<'s3'> {
    /**
     * Allowed MIME types for upload. Accepts '*' to allow all.
     * @default '*'
     */
    allowedMimeTypes?: '*' | string[];
    /**
     * The S3 bucket name to explore.
     */
    bucket: string;
    /**
     * AWS credentials. Falls back to environment variables / IAM role if omitted.
     */
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
    };
    /**
     * Custom endpoint — useful for MinIO, LocalStack, etc.
     */
    endpoint?: string;
    /**
     * Force path-style URLs (required for MinIO / LocalStack).
     * @default false
     */
    forcePathStyle?: boolean;
    /**
     * AWS region where the bucket lives.
     */
    region: string;
    storageType: 's3';
}
export interface S3Object {
    contentType?: string;
    etag?: string;
    isFolder: false;
    key: string;
    lastModified: Date;
    size: number;
}
export interface S3Folder {
    isFolder: true;
    lastModified?: Date;
    name: string;
    prefix: string;
    size?: number;
}
export type S3Item = S3Folder | S3Object;
export interface S3ListResult {
    files: S3Object[];
    folders: S3Folder[];
    isTruncated: boolean;
    nextContinuationToken?: string;
    prefix: string;
}
export interface PresignedUploadResult {
    fields: Record<string, string>;
    key: string;
    url: string;
}
export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    success: boolean;
}
export {};
