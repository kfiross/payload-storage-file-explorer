import type { CollectionConfig } from 'payload'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import dotenv from "dotenv"
import path from 'path'
import { buildConfig } from 'payload'
import { payloadStorageFileExplorer, s3ExplorerPluginOptions} from 'payload-storage-file-explorer'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

dotenv.config()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const Media: CollectionConfig = {
  slug: 'media',
  lockDocuments: false,
  upload: true,
  /**
   * Enable Payload's built-in Folders feature on this collection (beta).
   * This lets editors organise media into folders inside the Payload admin.
   * See: https://payloadcms.com/docs/folders/overview
   */
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    // {
    //   name: 'alt',
    //   type: 'text'
    // },
  ],
  folders: {
    browseByFolder: true,
  }
  // hooks: {
  //   beforeChange: [
  //     async ({ data, req }) => {
  //       if (data.folder) {
  //         const folder = await req.payload.findByID({
  //           id: data.folder,
  //           collection: 'folders',
  //         })
  //         // Map folder's fullPath → S3 prefix for the storage adapter
  //         data.folderPath = (folder as { fullPath?: string }).fullPath ?? ''
  //       }
  //       return data
  //     },
  //   ],
  // },
}

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'dashboardUsers',
      admin: {
        useAsTitle: 'email',
      },
      auth: true,
      dbName: 'dashboard_users',
      fields: [
        // {
        //   ...defaultTenantArrayField,
        //   admin: {
        //     ...(defaultTenantArrayField?.admin || {}),
        //     position: 'sidebar',
        //   },
        // },
      ],
      timestamps: true,
    },
    {
      slug: 'posts',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'description',
          type: 'textarea',
        }
      ],
      lockDocuments: false,
      timestamps: true,
    },
    Media,
    // {
    //   slug: 'media',
    //   fields: [],
    //   upload: {
    //     staticDir: path.resolve(dirname, 'media'),
    //   },
    // },
  ],
  folders: {
    // optional global folder settings
  },
  // db: mongooseAdapter({
  //   ensureIndexes: true,
  //   url: process.env.DATABASE_URL || '',
  // }),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    push: false,
  }),
  editor: lexicalEditor(),
  email: testEmailAdapter,
  onInit: async (payload) => {
    await seed(payload)
  },
  plugins: [
    s3Storage({
      bucket: process.env.S3_BUCKET!,
      collections: {
        media: {
          prefix: 'media',  // all media files land under s3://bucket/media/
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY!,
          secretAccessKey: process.env.S3_SECRET_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT!,
        forcePathStyle: true, // Important for using Supabase
        region: 'eu-west-3', //process.env.S3_REGION,
      },
    }),

    payloadStorageFileExplorer({
      adapterOptions: s3ExplorerPluginOptions({
        bucket: process.env.S3_BUCKET!,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY!,
          secretAccessKey: process.env.S3_SECRET_KEY!,

        },
        endpoint: process.env.S3_ENDPOINT!,

        region: 'eu-west-3', //process.env.S3_REGION!,


        // Optional: limits
        allowedMimeTypes: ['image/*', 'application/pdf', 'video/*'],

        forcePathStyle: true,
        storageType: 's3',
      }),



      // Optional: custom route & label
      adminRoute: '/explorer',
      navigationLabel: 'File Explorer',

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
  secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
