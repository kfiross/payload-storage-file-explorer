import { DeleteObjectCommand, DeleteObjectsCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
export function createS3Client(options) {
    const config = {
        region: options.region
    };
    if (options.credentials) {
        config.credentials = {
            accessKeyId: options.credentials.accessKeyId,
            secretAccessKey: options.credentials.secretAccessKey
        };
    }
    if (options.endpoint) {
        config.endpoint = options.endpoint;
    }
    if (options.forcePathStyle) {
        config.forcePathStyle = true;
    }
    return new S3Client(config);
}
const calcFolderInfo = async (client, bucket, prefix, continuationToken)=>{
    let totalSize = 0;
    let lastModified = undefined;
    do {
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            Delimiter: '/',
            MaxKeys: 200,
            Prefix: prefix
        });
        const response = await client.send(command);
        for (const obj of response.Contents ?? []){
            // accumulate size
            totalSize += obj.Size ?? 0;
            // update latest lastModified
            if (obj.LastModified) {
                if (!lastModified || obj.LastModified > lastModified) {
                    lastModified = obj.LastModified;
                }
            }
        }
        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    }while (continuationToken)
    return {
        lastModified,
        size: totalSize
    };
};
/**
 * List objects at a given prefix, splitting into folders and files.
 */ export async function listS3Objects(client, bucket, prefix, continuationToken) {
    const command = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        Delimiter: '/',
        MaxKeys: 200,
        Prefix: prefix
    });
    const response = await client.send(command);
    const foldersSizesPromises = [];
    const foldersNames = response.CommonPrefixes ?? [];
    for (const folder of foldersNames){
        foldersSizesPromises.push(calcFolderInfo(client, bucket, folder.Prefix));
    }
    const foldersSizes = await Promise.all(foldersSizesPromises);
    const folders = (response.CommonPrefixes ?? []).filter((p)=>p.Prefix && p.Prefix !== prefix).map((p, index)=>({
            name: p.Prefix.replace(prefix, '').replace(/\/$/, ''),
            isFolder: true,
            lastModified: foldersSizes[index].lastModified,
            prefix: p.Prefix,
            size: foldersSizes[index].size
        }));
    const files = (response.Contents ?? []).filter((c)=>c.Key && c.Key !== `${prefix}.emptyFolderPlaceholder`) // exclude the "folder-file" placeholder itself
    .map((c)=>({
            etag: c.ETag?.replace(/"/g, ''),
            isFolder: false,
            key: c.Key,
            lastModified: c.LastModified ?? new Date(),
            size: c.Size ?? 0
        }));
    return {
        files,
        folders,
        isTruncated: response.IsTruncated ?? false,
        nextContinuationToken: response.NextContinuationToken,
        prefix
    };
}
/**
 * Get a presigned download URL for a single object.
 */ export async function getPresignedDownloadUrl(client, bucket, key, expiresIn = 3600) {
    const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key
    });
    // Verify object exists first
    await client.send(command);
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    return getSignedUrl(client, getCommand, {
        expiresIn
    });
}
/**
 * Generate a presigned POST for direct browser → S3 upload.
 * Using POST (vs PUT) gives us size/type constraints server-side.
 */ export async function createPresignedUploadPost(client, bucket, key, options = {}) {
    const { allowedMimeTypes = '*', expiresIn = 600, maxSizeBytes = 50 * 1024 * 1024 } = options;
    const conditions = [
        [
            'content-length-range',
            0,
            maxSizeBytes
        ]
    ];
    if (Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0) {
        // Allow exact MIME or wildcard category e.g. "image/*"
        conditions.push([
            'starts-with',
            '$Content-Type',
            allowedMimeTypes[0].replace(/\/.+/, '/')
        ]);
    }
    const { fields, url } = await createPresignedPost(client, {
        Bucket: bucket,
        Conditions: conditions,
        Expires: expiresIn,
        Key: key
    });
    return {
        fields,
        key,
        url
    };
}
/**
 * Delete a single S3 object.
 */ export async function deleteS3Object(client, bucket, key) {
    await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
    }));
}
/**
 * Recursively delete all objects under a prefix (i.e., delete a "folder").
 */ export async function deleteS3Prefix(client, bucket, prefix) {
    let deleted = 0;
    let continuationToken;
    do {
        const list = await client.send(new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
            Prefix: prefix
        }));
        const keys = (list.Contents ?? []).map((c)=>({
                Key: c.Key
            }));
        if (keys.length > 0) {
            await client.send(new DeleteObjectsCommand({
                Bucket: bucket,
                Delete: {
                    Objects: keys,
                    Quiet: true
                }
            }));
            deleted += keys.length;
        }
        continuationToken = list.NextContinuationToken;
    }while (continuationToken)
    return {
        deleted
    };
}
/**
 * Create a "folder" placeholder object in S3.
 * S3 has no real folders — a zero-byte key ending in "/" is the convention.
 */ export async function createS3Folder(client, bucket, folderKey) {
    const key = folderKey.endsWith('/') ? folderKey : `${folderKey}/`;
    await client.send(new PutObjectCommand({
        Body: '',
        Bucket: bucket,
        ContentLength: 0,
        Key: key
    }));
}
/**
 * Format bytes to human-readable string.
 */ export function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) {
        return '0 B';
    }
    const k = 1024;
    const sizes = [
        'B',
        'KB',
        'MB',
        'GB',
        'TB'
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
/**
 * Derive a file's MIME type from its extension.
 */ export function getMimeType(key) {
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    const map = {
        css: 'text/css',
        csv: 'text/csv',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        gif: 'image/gif',
        gz: 'application/gzip',
        html: 'text/html',
        ico: 'image/x-icon',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        js: 'application/javascript',
        json: 'application/json',
        mov: 'video/quicktime',
        mp3: 'audio/mpeg',
        mp4: 'video/mp4',
        ogg: 'audio/ogg',
        pdf: 'application/pdf',
        png: 'image/png',
        svg: 'image/svg+xml',
        tar: 'application/x-tar',
        ts: 'application/typescript',
        txt: 'text/plain',
        wav: 'audio/wav',
        webm: 'video/webm',
        webp: 'image/webp',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        zip: 'application/zip'
    };
    return map[ext] ?? 'application/octet-stream';
}
/**
 * Is this key an image we can preview inline?
 */ export function isPreviewable(key) {
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    return [
        'gif',
        'ico',
        'jpeg',
        'jpg',
        'png',
        'svg',
        'webp'
    ].includes(ext);
}
/**
 * Build breadcrumb segments from a prefix string.
 */ export function buildBreadcrumbs(prefix) {
    const crumbs = [
        {
            label: 'Root',
            prefix: ''
        }
    ];
    if (!prefix) {
        return crumbs;
    }
    const parts = prefix.replace(/\/$/, '').split('/');
    parts.forEach((part, i)=>{
        crumbs.push({
            label: part,
            prefix: parts.slice(0, i + 1).join('/') + '/'
        });
    });
    return crumbs;
}

//# sourceMappingURL=s3Service.js.map