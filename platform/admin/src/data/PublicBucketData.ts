import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {get, post, putFile1} from '@/utils/ClientApi';
import {FileObject, TreeNode} from 'infra-common/system/Bucket';
import {listToTree, setParentReferences} from '@/utils/FileObjectUtils';
import {BUCKET_STATIC_DIR, BUCKET_ASSETS_DIR} from 'infra-common/constants';

export type PublicBucketStaticData = { publicFilesRoots: Array<TreeNode>; totalItems: number; totalSize: number; } | null;
export type PublicBucketStaticDataRequest = Promise<PublicBucketStaticData>;
export type PublicBucketAssetsData = { publicFilesRoots: Array<TreeNode>; totalItems: number; totalSize: number; } | null;
export type PublicBucketAssetsDataRequest = Promise<PublicBucketAssetsData>;

class PublicBucketDataSingleton {
    private staticDataInstance: PublicBucketStaticData;
    private assetsDataInstance: PublicBucketAssetsData;
    private fetchStaticFilesPromise: Promise<PublicBucketStaticData> | undefined;
    private fetchAssetsFilesPromise: Promise<PublicBucketAssetsData> | undefined;
    constructor() {
        this.staticDataInstance = null;
        this.assetsDataInstance = null;
        this.fetchStaticFilesPromise = undefined;
        this.fetchAssetsFilesPromise = undefined;
        this.fetchPublicFiles = this.fetchPublicFiles.bind(this);
    }

    private async fetchPublicFiles(dirName: string): Promise<Array<FileObject> | null> {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (!accessToken) {
            throw Error('Missing access token');
        }
        this.fetchStaticFilesPromise = undefined;
        return get<Array<FileObject>>(
            `/api/admin/get-public-files?dirName=${dirName}`,
            accessToken
        );
    }

    public async getPublicStaticFiles(): PublicBucketStaticDataRequest {
        if (this.staticDataInstance) {
            return this.staticDataInstance;
        }
        if (!this.fetchStaticFilesPromise) {
            this.fetchStaticFilesPromise = (async () => {
                this.staticDataInstance = null;
                let publicFilesRoots: Array<TreeNode> = [];
                const publicStaticFiles = await this.fetchPublicFiles(BUCKET_STATIC_DIR);
                let totalItems = 0;
                let totalSize = 0;
                if (publicStaticFiles) {
                    for (const fileItem of publicStaticFiles) {
                        if (fileItem && fileItem.size !== undefined && fileItem.size > 0) {
                            totalItems++;
                            totalSize += fileItem.size || 0;
                        }
                    }
                    publicFilesRoots = listToTree(publicStaticFiles);
                    if (publicFilesRoots && publicFilesRoots.length > 0) {
                        for (const filesRoot of publicFilesRoots) {
                            setParentReferences(filesRoot);
                        }
                    }
                    this.staticDataInstance = {
                        publicFilesRoots,
                        totalItems,
                        totalSize
                    };
                }
                return this.staticDataInstance;
            })().finally(() => {
                this.fetchStaticFilesPromise = undefined;
            });
        }
        return this.fetchStaticFilesPromise;
    }

    public async getPublicAssetsFiles(): PublicBucketAssetsDataRequest {
        if (this.assetsDataInstance) {
            return this.assetsDataInstance;
        }
        if (!this.fetchAssetsFilesPromise) {
            this.fetchAssetsFilesPromise = (async () => {
                this.assetsDataInstance = null;
                let publicFilesRoots: Array<TreeNode> = [];
                const publicAssetsFiles = await this.fetchPublicFiles(BUCKET_ASSETS_DIR);
                if (publicAssetsFiles) {
                    let totalItems = 0;
                    let totalSize = 0;
                    for (const fileItem of publicAssetsFiles) {
                        if (fileItem && fileItem.size !== undefined && fileItem.size > 0) {
                            totalItems++;
                            totalSize += fileItem.size || 0;
                        }
                    }
                    publicFilesRoots = listToTree(publicAssetsFiles);
                    if (publicFilesRoots && publicFilesRoots.length > 0) {
                        for (const filesRoot of publicFilesRoots) {
                            setParentReferences(filesRoot);
                        }
                    }
                    this.assetsDataInstance = {
                        publicFilesRoots,
                        totalItems,
                        totalSize
                    };
                }
                return this.assetsDataInstance;
            })().finally(() => {
                this.fetchAssetsFilesPromise = undefined;
            });
        }
        return this.fetchAssetsFilesPromise;
    }

    public async uploadPublicFiles(
        files: Array<File>,
        progressCB: (complete: number, total: number, cancel: () => void) => void,
        rootPath?: string
    ): Promise<void> {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (!accessToken) {
            throw Error('Missing access token');
        }

        let totalSize = 0;
        for (const fileItem of files) {
            totalSize += fileItem.size;
        }
        let uploadedSize = 0;
        const filePaths: Array<string> = [];
        for (const fileItem of files) {
            const filePath: string = rootPath ? `${rootPath}${fileItem.name}` : fileItem.name;
            const postResult = await post<{ url: string }>('/api/admin/post-add-public-file', {filePath}, accessToken);
            filePaths.push(filePath);
            if (postResult) {
                const {url} = postResult;
                const wrappedProgressCB = (progress: number, cancel: () => void) => {
                    const cumulativeProgress = uploadedSize + progress;
                    progressCB(cumulativeProgress, totalSize, cancel);
                };
                await putFile1(url, fileItem, wrappedProgressCB);
                uploadedSize += fileItem.size;
            }
        }
        if (filePaths.length > 0) {
            await post<any>('/api/admin/post-invalidate-paths', {paths: filePaths}, accessToken);
        }
        if (rootPath) {
            const inStaticDir = rootPath.startsWith(BUCKET_STATIC_DIR);
            const inAssetsDir = rootPath.startsWith(BUCKET_ASSETS_DIR);
            if (inStaticDir) this.staticDataInstance = null;
            if (inAssetsDir) this.assetsDataInstance = null;
        }
    };

    public async addFolder(rootPath: string): Promise<void> {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (!accessToken) {
            throw Error('Missing access token');
        }
        const postResult = await post<{ url: string }>(`/api/admin/post-add-public-file`, {
            filePath: `${rootPath}/`
        }, accessToken);
        if (postResult) {
            const {url} = postResult;
            await fetch(url, {method: 'PUT'});
            const inStaticDir = rootPath.startsWith(BUCKET_STATIC_DIR);
            const inAssetsDir = rootPath.startsWith(BUCKET_ASSETS_DIR);
            if (inStaticDir) this.staticDataInstance = null;
            if (inAssetsDir) this.assetsDataInstance = null;
        }
    }

    public async deleteFiles(filePaths: Array<string>): Promise<void> {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (!accessToken) {
            throw Error('Missing access token');
        }
        const hasStaticFiles = filePaths.findIndex(i => i.startsWith(BUCKET_STATIC_DIR));
        const hasAssetsFiles = filePaths.findIndex(i => i.startsWith(BUCKET_ASSETS_DIR));
        await post<{ url: string }>(`/api/admin/post-delete-public-files`, {
            filePaths
        }, accessToken);
        if (hasStaticFiles >= 0) this.staticDataInstance = null;
        if (hasAssetsFiles >= 0) this.assetsDataInstance = null;
    }

    public invalidateData(): void {
        this.staticDataInstance = null;
        this.assetsDataInstance = null;
    }
}

export const publicBucketDataSingleton = new PublicBucketDataSingleton();
