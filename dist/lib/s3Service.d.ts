import { S3Client } from '@aws-sdk/client-s3';
import type { PresignedUploadResult, S3ExplorerPluginOptions, S3ListResult } from '../types/index.js';
export declare function createS3Client(options: S3ExplorerPluginOptions): S3Client;
/**
 * List objects at a given prefix, splitting into folders and files.
 */
export declare function listS3Objects(client: S3Client, bucket: string, prefix: string, continuationToken?: string): Promise<S3ListResult>;
/**
 * Get a presigned download URL for a single object.
 */
export declare function getPresignedDownloadUrl(client: S3Client, bucket: string, key: string, expiresIn?: number): Promise<string>;
/**
 * Generate a presigned POST for direct browser → S3 upload.
 * Using POST (vs PUT) gives us size/type constraints server-side.
 */
export declare function createPresignedUploadPost(client: S3Client, bucket: string, key: string, options?: {
    allowedMimeTypes?: '*' | string[];
    expiresIn?: number;
    maxSizeBytes?: number;
}): Promise<PresignedUploadResult>;
/**
 * Delete a single S3 object.
 */
export declare function deleteS3Object(client: S3Client, bucket: string, key: string): Promise<void>;
/**
 * Recursively delete all objects under a prefix (i.e., delete a "folder").
 */
export declare function deleteS3Prefix(client: S3Client, bucket: string, prefix: string): Promise<{
    deleted: number;
}>;
/**
 * Create a "folder" placeholder object in S3.
 * S3 has no real folders — a zero-byte key ending in "/" is the convention.
 */
export declare function createS3Folder(client: S3Client, bucket: string, folderKey: string): Promise<void>;
/**
 * Format bytes to human-readable string.
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Derive a file's MIME type from its extension.
 */
export declare function getMimeType(key: string): string;
/**
 * Is this key an image we can preview inline?
 */
export declare function isPreviewable(key: string): boolean;
/**
 * Build breadcrumb segments from a prefix string.
 */
export declare function buildBreadcrumbs(prefix: string): {
    label: string;
    prefix: string;
}[];
