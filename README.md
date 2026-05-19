# Payload Storage File Explorer

A Payload CMS plugin that adds an S3-compatible file explorer to the Payload admin. It mounts an admin view and registers small Payload endpoints to list, preview, download, upload (presigned POST), create folders, and delete objects or prefixes.

![Home](./images/home.png)
## Overview

- **Admin UI**: Adds a configurable admin route (default `/explorer`) with list/grid views, previews, drag & drop uploads, bulk actions and folder navigation.
- **Server endpoints**: Registers Payload endpoints under `/api/s3-explorer` for listing, presigned uploads, presigned downloads, folder creation and deletion.
- **S3-compatible**: Uses AWS SDK for S3 but supports custom endpoints (MinIO, LocalStack) and path-style URLs.

## Features

- **Browse buckets**: paginate and show folders/files with sizes and last-modified.
- **Preview & download**: presigned GET URLs for preview/download of objects.
- **Direct uploads**: presigned POST (browser → S3) with size and MIME constraints.
- **Folder create**: creates zero-byte "folder" placeholder objects (key ends with `/`).
- **Delete**: delete single objects or recursively delete a prefix (folder).
- **Bulk actions**: select multiple files to download or delete.
- **Configurable**: enable/disable uploads, deletes, downloads; set root prefix, max upload size, presigned expiry, navigation label and admin route.

## Quick Install

1. Install the package in your project (example using pnpm):

```bash
pnpm add payload-storage-file-explorer
```

2. Add the plugin to your Payload config (`payload.config.ts`):

```ts
import { payloadStorageFileExplorer, s3ExplorerPluginOptions } from 'payload-storage-file-explorer'

export default buildConfig({
  plugins: [
    payloadStorageFileExplorer({
      adapterOptions: s3ExplorerPluginOptions({
        bucket: process.env.S3_BUCKET!,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY!,
          secretAccessKey: process.env.S3_SECRET_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT!,
        region: 'eu-west-3',
        // Optional: limits
        allowedMimeTypes: ['image/*', 'application/pdf', 'video/*'],
        forcePathStyle: true,
        storageType: 's3',
      }),

      // Optional: custom route & label
      adminRoute: '/explorer',
      navigationLabel: 'File Explorer',

      // Optional overrides
      maxUploadSize: 50 * 1024 * 1024, // 50 MB

      // Optional: disable features
      enableDelete: true,
      enableDownload: true,
      enableFolderCreate: true,
      enableUpload: true,

      // Optional: presigned URL expiry (seconds)
      presignedUrlExpiry: 3600,

      // Optional: scope to a subfolder
      // rootPrefix: 'uploads/',
    }),
  ],
})
```

- **Configuration options**

- **adapterOptions**: required adapter configuration. Currently the plugin supports an S3-compatible adapter; see `S3ExplorerPluginOptions` in [src/types/index.ts](src/types/index.ts).
- **adminRoute**: admin path where the view is mounted. Default: `/explorer`.
- **enableDelete**: allow deleting objects/prefixes. Default: `true`.
- **enableDownload**: enable presigned downloads. Default: `true`.
- **enableFolderCreate**: allow creating folders. Default: `true`.
- **enableUpload**: allow uploads. Default: `true`.
- **maxUploadSize**: max upload size in bytes. Default: `100 * 1024 * 1024` (100 MB).
- **navigationLabel**: label for admin sidebar. Default: `File Explorer`.
- **presignedUrlExpiry**: presigned GET expiry in seconds. Default: `3600`.
- **rootPrefix**: optional root prefix to scope explorer to a subfolder. Default: `''`.

See [src/index.ts](src/index.ts) for the authoritative defaults and wiring.

### API Endpoints

All endpoints are registered on the plugin and available under `/api/s3-explorer`.

- GET `/api/s3-explorer/list?prefix=<prefix>&token=<continuationToken>`
  - Response: `{ success: true, data: S3ListResult }`
- GET `/api/s3-explorer/download?key=<objectKey>`
  - Returns a presigned GET URL: `{ success: true, data: { key, url } }`
- POST `/api/s3-explorer/upload`
  - Body: `{ prefix, filename, contentType }`
  - Returns presigned POST details: `{ success: true, data: { url, fields, key } }`
- POST `/api/s3-explorer/folder`  — create new folder placeholder
  - Body: `{ prefix, name }` → `{ success: true, data: { folderKey } }`
- DELETE `/api/s3-explorer/delete`
  - Body: `{ key }` deletes a single object OR `{ prefix }` deletes all objects under that prefix (recursive)

Examples (list & download):

```bash
curl 'http://localhost:3000/api/s3-explorer/list?prefix=media/'

curl 'http://localhost:3000/api/s3-explorer/download?key=media/example.jpg'
```

## Adapters

This plugin is built to support interchangeable storage adapters. At present it ships with an S3-compatible adapter. Future releases may add additional adapters (e.g., Vercel Blob, Google Cloud Storage, Azure Blob).


**S3 (current)**

Use the `s3ExplorerPluginOptions()` helper to build S3 adapter options. Supported S3 adapter options (see [src/types/index.ts](src/types/index.ts)):

- `bucket` (string) — required S3 bucket name.
- `region` (string) — AWS region.
- `credentials` — optional `{ accessKeyId, secretAccessKey, sessionToken? }`.
- `endpoint` — optional custom endpoint (MinIO, LocalStack).
- `forcePathStyle` — boolean for path-style URLs (MinIO/local testing).
- `allowedMimeTypes` — `'*'` or array of MIME types to restrict uploads.

The plugin will fall back to environment credentials / IAM role if `credentials` are omitted.

**Admin UI**

- Mounts a server-wrapped RSC at the configured `adminRoute` using `S3ExplorerViewServer`.
- Client features include grid/list views, file/folder metadata, previews (images, PDFs), drag & drop upload, create-folder drawer, selection, sorting and bulk actions. See [src/components/S3ExplorerViewClient.tsx](src/components/S3ExplorerViewClient.tsx) for implementation details.

**Development**

- Repo layout: plugin code is in `src/`, a local dev Payload app is in `dev/`.
- To run the dev app (from project root):

```bash
pnpm install
pnpm --filter ./dev dev
```

Or change into the `dev` folder and run the app with your package manager. Ensure you copy `.env.example` → `.env` and set `DATABASE_URL` and `PAYLOAD_SECRET` before running.

**License & support**

This repository is provided as-is. For questions about Payload integration, contact the Payload team or open an issue in this repository.
