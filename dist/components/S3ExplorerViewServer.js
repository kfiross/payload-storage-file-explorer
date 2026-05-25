import { jsx as _jsx } from "react/jsx-runtime";
import { DefaultTemplate } from '@payloadcms/next/templates';
import { Gutter } from '@payloadcms/ui';
import React from 'react';
import { S3ExplorerViewClient } from './S3ExplorerViewClient.js';
/**
 * Server Component — wraps the client explorer.
 * Payload's DefaultTemplate is passed via initPageResult for consistent chrome.
 */ export const S3ExplorerViewServer = ({ initPageResult, params, searchParams, ...props })=>{
    const { apiBasePath, options: pluginOptions } = props.payload.config.admin.custom.s3FileExplorer ?? {};
    const clientOptions = {
        enableDelete: pluginOptions.enableDelete ?? true,
        enableDownload: pluginOptions.enableDownload ?? true,
        enableFolderCreate: pluginOptions.enableFolderCreate ?? true,
        enableUpload: pluginOptions.enableUpload ?? true,
        maxUploadSize: pluginOptions.maxUploadSize ?? 50 * 1024 * 1024,
        rootPrefix: pluginOptions.rootPrefix ?? ''
    };
    return /*#__PURE__*/ _jsx(DefaultTemplate, {
        i18n: initPageResult.req.i18n,
        locale: initPageResult.locale,
        params: params,
        payload: initPageResult.req.payload,
        permissions: initPageResult.permissions,
        searchParams: searchParams,
        user: initPageResult.req.user || undefined,
        visibleEntities: initPageResult.visibleEntities,
        children: /*#__PURE__*/ _jsx(Gutter, {
            children: /*#__PURE__*/ _jsx(S3ExplorerViewClient, {
                apiBasePath: apiBasePath,
                options: clientOptions
            })
        })
    });
};

//# sourceMappingURL=S3ExplorerViewServer.js.map