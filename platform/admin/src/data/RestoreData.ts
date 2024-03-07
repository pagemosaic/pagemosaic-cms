import {toast} from 'sonner';
import mime from 'mime/lite';
import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {post, putFile1} from '@/utils/ClientApi';
import {pagesDataSingleton} from '@/data/PagesData';
import {publicBucketDataSingleton} from '@/data/PublicBucketData';
import {siteDataSingleton} from '@/data/SiteData';
import {generatorDataSingleton} from '@/data/GeneratorData';
import {systemInfoDataSingleton} from '@/data/SystemInfoData';

export type RestoreDataRequest = Promise<void>;

const wrappedProgressCB = (progress: number, cancel: () => void) => {
};

class RestoreDataSingleton {
    private restorePromise: RestoreDataRequest | undefined;
    constructor() {
        this.restorePromise = undefined;
        this.processFile = this.processFile.bind(this);
    }

    private findTopMostFolder(content: any): string | undefined  {
        const topMostFolders = new Set<string>();
        for (const filename in content.files) {
            const fileData = content.files[filename];
            if (fileData.dir) {
                const topLevelDir = filename.split('/')[0];
                topMostFolders.add(topLevelDir);
            }
        }
        return Array.from(topMostFolders)[0];
    }

    private async processFile(file: File): RestoreDataRequest {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            const zip = new (window as any).JSZip();
            const content = await zip.loadAsync(file); // Load the ZIP file
            const contextDir = this.findTopMostFolder(content);
            if (!contextDir) {
                throw Error('Missing the top-most folder in the pack');
            }
            const documentsRecords: Array<any> = [];
            let isSystemDocuments = false;
            for (const filename in content.files) {
                const fileData = content.files[filename];
                if (!fileData.dir) { // Ignore directories since their paths are included in file paths
                    if (filename.startsWith(`${contextDir}/data/documents`)) {
                        const jsonContent = await fileData.async('string'); // Read the file content as a string
                        documentsRecords.push(JSON.parse(jsonContent));
                    } else if (filename.startsWith(`${contextDir}/system/documents`)) {
                        isSystemDocuments = true;
                    }
                }
            }
            if (documentsRecords.length === 0 || !isSystemDocuments) {
                throw Error('The package has incorrect structure.');
            }
            await post<any>('/api/admin/post-delete-records', {}, accessToken);
            await post<any>('/api/admin/post-restore-records', {documents: documentsRecords}, accessToken);
            toast.success('The records have been successfully restored');
            const invalidatePaths: Array<string> = [];
            for (const filename in content.files) {
                const fileData = content.files[filename];
                if (!fileData.dir) {
                    let fileContentType: string = mime.getType(filename) || 'application/octet-stream';
                    if (filename.startsWith(`${contextDir}/system/documents`)) {
                        const systemFilePath = filename.replace(`${contextDir}/system/`, '');
                        const fileBody = await fileData.async('string');
                        await post<any>('/api/admin/post-add-system-file', {
                            file: {
                                filePath: systemFilePath,
                                fileBody,
                                fileContentType,
                            }
                        }, accessToken);
                        // console.log(`Uploaded ${systemFilePath}`);
                    } else if (filename.startsWith(`${contextDir}/public`)) {
                        const publicFilePath = filename.replace(`${contextDir}/public/`, '');
                        const postResult = await post<{ url: string }>('/api/admin/post-add-public-file', {filePath: publicFilePath}, accessToken);
                        if (postResult) {
                            // Create a blob from the string body
                            const blob = await fileData.async('blob');
                            // Create a File object from the blob
                            const file = new File([blob], filename.split('/').pop()!, { type: fileContentType });
                            await putFile1(postResult.url, file, wrappedProgressCB);
                            // console.log(`Uploaded ${publicFilePath}`);
                            invalidatePaths.push(publicFilePath);
                        }
                    }
                }
            }
            if (invalidatePaths.length > 0) {
                await post<any>('/api/admin/post-invalidate-paths', {paths: invalidatePaths}, accessToken);
            }
            pagesDataSingleton.invalidateData();
            publicBucketDataSingleton.invalidateData();
            siteDataSingleton.invalidateData();
            systemInfoDataSingleton.invalidateData();
            generatorDataSingleton.invalidateData();
            toast.success('The files have been successfully uploaded');
        } else {
            throw Error('Missing access token');
        }
    }

    async restoreData(file: File): RestoreDataRequest {
        if (!this.restorePromise) {
            this.restorePromise = (async () => {
                await this.processFile(file);
                this.restorePromise = undefined;
            })().catch((e: any) => {
                this.restorePromise = undefined;
                throw e;
            });
        }
        return this.restorePromise;
    }
}

export const restoreDataSingleton = new RestoreDataSingleton();
