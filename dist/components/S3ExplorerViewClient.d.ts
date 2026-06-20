import type { PayloadStorageFileExplorerConfig } from '../index.js';
interface ExplorerProps {
    apiBasePath: string;
    options: Pick<PayloadStorageFileExplorerConfig, 'enableDelete' | 'enableDownload' | 'enableFolderCreate' | 'enableUpload' | 'maxUploadSize' | 'rootPrefix' | 'access' | 'pageTitle' | 'allowedExtensions' | 'allowedMimeTypes'>;
}
export declare function S3ExplorerViewClient({ apiBasePath, options }: ExplorerProps): import("react/jsx-runtime").JSX.Element;
export {};
