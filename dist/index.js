import { makeDeleteHandler, makeDownloadHandler, makeFolderHandler, makeListHandler, makeUploadHandler } from './endpoints/customEndpointHandlers.js';
const apiBasePath = '/api/s3-explorer';
export const payloadStorageFileExplorer = (pluginOptions)=>{
    return (config)=>{
        const adminRoute = pluginOptions.adminRoute ?? '/explorer';
        if (!config.collections) {
            config.collections = [];
        }
        /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */ if (pluginOptions.disabled) {
            return config;
        }
        if (!config.endpoints) {
            config.endpoints = [];
        }
        if (!config.admin) {
            config.admin = {};
        }
        if (!config.admin.components) {
            config.admin.components = {};
        }
        if (!config.admin.components.views) {
            config.admin.components.views = {};
        }
        if (!config.admin.custom) {
            config.admin.custom = {};
        }
        config.admin.custom.s3FileExplorer = {
            apiBasePath,
            options: pluginOptions
        };
        if (pluginOptions.adapterOptions.storageType === 's3') {
            config.admin.components.views.s3FileExplorer = {
                // Payload v3 resolves this as a module#exportName path.
                // The RSC wrapper reads plugin options from config.custom
                // so no secrets end up in the client bundle.
                Component: '@kfiross44/payload-storage-file-explorer/rsc#S3ExplorerViewServer',
                meta: {
                    description: `Browse S3 bucket: ${pluginOptions.adapterOptions.bucket}`,
                    title: pluginOptions.navigationLabel ?? 'File Explorer'
                },
                serverProps: {
                    apiBasePath,
                    options: pluginOptions
                },
                //@ts-ignore
                path: adminRoute
            };
        }
        const explorerEndpoints = [
            {
                handler: makeListHandler(pluginOptions),
                method: 'get',
                path: '/s3-explorer/list'
            },
            {
                handler: makeDownloadHandler(pluginOptions),
                method: 'get',
                path: '/s3-explorer/download'
            },
            {
                handler: makeUploadHandler(pluginOptions),
                method: 'post',
                path: '/s3-explorer/upload'
            },
            {
                handler: makeFolderHandler(pluginOptions),
                method: 'post',
                path: '/s3-explorer/folder'
            },
            {
                handler: makeDeleteHandler(pluginOptions),
                method: 'delete',
                path: '/s3-explorer/delete'
            }
        ];
        config.endpoints.push(...explorerEndpoints);
        const incomingOnInit = config.onInit;
        config.onInit = async (payload)=>{
            // Ensure we are executing any existing onInit functions before running our own.
            if (incomingOnInit) {
                await incomingOnInit(payload);
            }
        };
        return config;
    };
};
export function s3ExplorerPluginOptions(options) {
    return {
        ...options
    };
}

//# sourceMappingURL=index.js.map