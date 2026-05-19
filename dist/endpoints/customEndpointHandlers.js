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
 */ import { createPresignedUploadPost, createS3Client, createS3Folder, deleteS3Object, deleteS3Prefix, getPresignedDownloadUrl, listS3Objects } from '../lib/s3Service.js';
// ─── helpers ─────────────────────────────────────────────────────────────────
function json(data, status = 200) {
    return Response.json(data, {
        status
    });
}
// ─── list ─────────────────────────────────────────────────────────────────────
/**
 * GET /api/s3-explorer/list?prefix=some/path/&token=<continuationToken>
 * Returns { success, data: S3ListResult }
 */ export function makeListHandler({ adapterOptions, ...options }) {
    return async (req)=>{
        if (adapterOptions.storageType !== 's3') {
            throw new Error(`storageType '${adapterOptions.storageType}' is not supported `);
        }
        try {
            const url = new URL(req.url);
            const prefix = url.searchParams.get('prefix') ?? '';
            const continuationToken = url.searchParams.get('token') ?? undefined;
            const rootPrefix = options.rootPrefix ?? '';
            // Never let the caller escape outside the configured rootPrefix
            const safePrefix = prefix.startsWith(rootPrefix) ? prefix : rootPrefix;
            const client = createS3Client(adapterOptions);
            const result = await listS3Objects(client, adapterOptions.bucket, safePrefix, continuationToken);
            return json({
                data: result,
                success: true
            });
        } catch (err) {
            return json({
                error: err instanceof Error ? err.message : 'Unknown error',
                success: false
            }, 500);
        }
    };
}
// ─── upload (presign) ─────────────────────────────────────────────────────────
/**
 * POST /api/s3-explorer/upload
 * Body: { prefix, filename, contentType }
 * Returns { success, data: { url, fields, key } }  — client POSTs directly to S3.
 */ export function makeUploadHandler({ adapterOptions, ...options }) {
    return async (req)=>{
        if (adapterOptions.storageType !== 's3') {
            throw new Error(`storageType '${adapterOptions.storageType}' is not supported `);
        }
        if (!(options.enableUpload ?? true)) {
            return json({
                error: 'Uploads are disabled',
                success: false
            }, 403);
        }
        try {
            // Payload v3 exposes the parsed body via req.json()
            // @ts-ignore
            const body = await req.json();
            const { filename, prefix = '' } = body;
            if (!filename) {
                return json({
                    error: 'filename is required',
                    success: false
                }, 400);
            }
            const rootPrefix = options.rootPrefix ?? '';
            const safePrefix = prefix.startsWith(rootPrefix) ? prefix : rootPrefix;
            const key = `${safePrefix}${filename}`;
            const client = createS3Client(adapterOptions);
            const result = await createPresignedUploadPost(client, adapterOptions.bucket, key, {
                allowedMimeTypes: adapterOptions.allowedMimeTypes,
                expiresIn: 600,
                maxSizeBytes: options.maxUploadSize
            });
            return json({
                data: result,
                success: true
            });
        } catch (err) {
            return json({
                error: err instanceof Error ? err.message : 'Unknown error',
                success: false
            }, 500);
        }
    };
}
// ─── delete ───────────────────────────────────────────────────────────────────
/**
 * DELETE /api/s3-explorer/delete
 * Body: { key } for a single file  OR  { prefix } for an entire folder (recursive).
 * Returns { success, data: { key } | { deleted: number } }
 */ export function makeDeleteHandler({ adapterOptions, ...options }) {
    return async (req)=>{
        if (adapterOptions.storageType !== 's3') {
            throw new Error(`storageType '${adapterOptions.storageType}' is not supported `);
        }
        if (!(options.enableDelete ?? true)) {
            return json({
                error: 'Deletes are disabled',
                success: false
            }, 403);
        }
        try {
            // @ts-ignore
            const body = await req.json();
            const { key, prefix } = body;
            const rootPrefix = options.rootPrefix ?? '';
            const client = createS3Client(adapterOptions);
            if (prefix) {
                if (rootPrefix && !prefix.startsWith(rootPrefix)) {
                    return json({
                        error: 'Access denied',
                        success: false
                    }, 403);
                }
                const { deleted } = await deleteS3Prefix(client, adapterOptions.bucket, prefix);
                return json({
                    data: {
                        deleted
                    },
                    success: true
                });
            }
            if (key) {
                await deleteS3Object(client, adapterOptions.bucket, key);
                return json({
                    data: {
                        key
                    },
                    success: true
                });
            }
            return json({
                error: 'key or prefix is required',
                success: false
            }, 400);
        } catch (err) {
            return json({
                error: err instanceof Error ? err.message : 'Unknown error',
                success: false
            }, 500);
        }
    };
}
// ─── folder create ────────────────────────────────────────────────────────────
/**
 * POST /api/s3-explorer/folder
 * Body: { prefix, name }
 * Returns { success, data: { folderKey } }
 */ export function makeFolderHandler({ adapterOptions, ...options }) {
    if (adapterOptions.storageType !== 's3') {
        throw new Error(`storageType '${adapterOptions.storageType}' is not supported `);
    }
    return async (req)=>{
        if (!(options.enableFolderCreate ?? true)) {
            return json({
                error: 'Folder creation is disabled',
                success: false
            }, 403);
        }
        try {
            // @ts-ignore
            const body = await req.json();
            const { name, prefix = '' } = body;
            if (!name) {
                return json({
                    error: 'name is required',
                    success: false
                }, 400);
            }
            if (!/^[\w\-. ]+$/.test(name)) {
                return json({
                    error: 'Folder name contains invalid characters',
                    success: false
                }, 400);
            }
            const rootPrefix = options.rootPrefix ?? '';
            const safePrefix = prefix.startsWith(rootPrefix) ? prefix : rootPrefix;
            const folderKey = `${safePrefix}${name}/`;
            const client = createS3Client(adapterOptions);
            await createS3Folder(client, adapterOptions.bucket, folderKey);
            return json({
                data: {
                    folderKey
                },
                success: true
            });
        } catch (err) {
            console.warn({
                err
            });
            return json({
                error: err instanceof Error ? err.message : 'Unknown error',
                success: false
            }, 500);
        }
    };
}
// ─── download (presign) ───────────────────────────────────────────────────────
/**
 * GET /api/s3-explorer/download?key=some/path/file.jpg
 * Returns { success, data: { url, key } }  — presigned GET URL.
 */ export function makeDownloadHandler({ adapterOptions, ...options }) {
    return async (req)=>{
        if (adapterOptions.storageType !== 's3') {
            throw new Error(`storageType '${adapterOptions.storageType}' is not supported `);
        }
        if (!(options.enableDownload ?? true)) {
            return json({
                error: 'Downloads are disabled',
                success: false
            }, 403);
        }
        try {
            const url = new URL(req.url);
            const key = url.searchParams.get('key');
            if (!key) {
                return json({
                    error: 'key is required',
                    success: false
                }, 400);
            }
            const rootPrefix = options.rootPrefix ?? '';
            if (rootPrefix && !key.startsWith(rootPrefix)) {
                return json({
                    error: 'Access denied',
                    success: false
                }, 403);
            }
            const client = createS3Client(adapterOptions);
            const presignedUrl = await getPresignedDownloadUrl(client, adapterOptions.bucket, key, options.presignedUrlExpiry ?? 3600);
            return json({
                data: {
                    key,
                    url: presignedUrl
                },
                success: true
            });
        } catch (err) {
            return json({
                error: err instanceof Error ? err.message : 'Unknown error',
                success: false
            }, 500);
        }
    };
}

//# sourceMappingURL=customEndpointHandlers.js.map