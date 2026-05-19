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
import type { PayloadHandler } from 'payload';
import type { PayloadStorageFileExplorerConfig } from '../index.js';
/**
 * GET /api/s3-explorer/list?prefix=some/path/&token=<continuationToken>
 * Returns { success, data: S3ListResult }
 */
export declare function makeListHandler({ adapterOptions, ...options }: PayloadStorageFileExplorerConfig): PayloadHandler;
/**
 * POST /api/s3-explorer/upload
 * Body: { prefix, filename, contentType }
 * Returns { success, data: { url, fields, key } }  — client POSTs directly to S3.
 */
export declare function makeUploadHandler({ adapterOptions, ...options }: PayloadStorageFileExplorerConfig): PayloadHandler;
/**
 * DELETE /api/s3-explorer/delete
 * Body: { key } for a single file  OR  { prefix } for an entire folder (recursive).
 * Returns { success, data: { key } | { deleted: number } }
 */
export declare function makeDeleteHandler({ adapterOptions, ...options }: PayloadStorageFileExplorerConfig): PayloadHandler;
/**
 * POST /api/s3-explorer/folder
 * Body: { prefix, name }
 * Returns { success, data: { folderKey } }
 */
export declare function makeFolderHandler({ adapterOptions, ...options }: PayloadStorageFileExplorerConfig): PayloadHandler;
/**
 * GET /api/s3-explorer/download?key=some/path/file.jpg
 * Returns { success, data: { url, key } }  — presigned GET URL.
 */
export declare function makeDownloadHandler({ adapterOptions, ...options }: PayloadStorageFileExplorerConfig): PayloadHandler;
