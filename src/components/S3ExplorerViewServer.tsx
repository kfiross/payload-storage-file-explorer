import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import React from 'react'

import { S3ExplorerViewClient } from './S3ExplorerViewClient.js'

/**
 * Server Component — wraps the client explorer.
 * Payload's DefaultTemplate is passed via initPageResult for consistent chrome.
 */
export const  S3ExplorerViewServer: React.FC<AdminViewServerProps> = async ({
  initPageResult,
  params,
  searchParams,
  user,
  ...props
}) => {
  const { apiBasePath, options: pluginOptions } =
    props.payload.config.admin.custom.s3FileExplorer ?? {}

  const canUserDelete = pluginOptions.access?.canDelete ? await pluginOptions.access.canDelete({ req: initPageResult.req }) : pluginOptions.enableDelete ?? true
  const canUserDownload = pluginOptions.access?.canDownload ? await pluginOptions.access.canDownload({ req: initPageResult.req }) : pluginOptions.enableDownload ?? true
  const canUserCreateFolders = pluginOptions.access?.canCreateFolders ? await pluginOptions.access.canCreateFolders({ req: initPageResult.req }) : pluginOptions.enableFolderCreate ?? true
  const canUserUpload = pluginOptions.access?.canUpload ? await pluginOptions.access.canUpload({ req: initPageResult.req }) : pluginOptions.enableUpload ?? true

  const clientOptions = {
    enableDelete: canUserDelete,
    enableDownload: canUserDownload,
    enableFolderCreate: canUserCreateFolders,
    enableUpload: canUserUpload,
    maxUploadSize: pluginOptions.maxUploadSize ?? 50 * 1024 * 1024,
    rootPrefix: pluginOptions.rootPrefix ?? '',
    pageTitle: pluginOptions.pageTitle ?? 'S3 File Explorer',
    allowedMimeTypes: pluginOptions.allowedMimeTypes,
    allowedExtensions: pluginOptions.allowedExtensions,
  }

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <S3ExplorerViewClient 
            apiBasePath={apiBasePath} 
            options={clientOptions} 
         />
      </Gutter>
    </DefaultTemplate>
  )
}
