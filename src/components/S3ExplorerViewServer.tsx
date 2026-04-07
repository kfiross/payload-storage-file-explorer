import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import React from 'react'

import { S3ExplorerViewClient } from './S3ExplorerViewClient.js'

/**
 * Server Component — wraps the client explorer.
 * Payload's DefaultTemplate is passed via initPageResult for consistent chrome.
 */
export const S3ExplorerViewServer: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
  ...props
}) => {
  const { apiBasePath, options: pluginOptions } =
    props.payload.config.admin.custom.s3FileExplorer ?? {}

  const clientOptions = {
    enableDelete: pluginOptions.enableDelete ?? true,
    enableDownload: pluginOptions.enableDownload ?? true,
    enableFolderCreate: pluginOptions.enableFolderCreate ?? true,
    enableUpload: pluginOptions.enableUpload ?? true,
    maxUploadSize: pluginOptions.maxUploadSize ?? 100 * 1024 * 1024,
    rootPrefix: pluginOptions.rootPrefix ?? '',
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
        {/*<div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px'}}>*/}
        {/*  <h1>Sending a push message</h1>*/}
        {/*  <p>Here you can send a notfication to user or a group of users</p>*/}
        {/*</div>*/}
        <S3ExplorerViewClient apiBasePath={apiBasePath} options={clientOptions} />
      </Gutter>
    </DefaultTemplate>
  )
}
