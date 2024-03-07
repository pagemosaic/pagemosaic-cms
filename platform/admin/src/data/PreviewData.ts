import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {get} from '@/utils/ClientApi';

export type PreviewData = {domain: string} | null;
export type PreviewDataRequest = Promise<PreviewData>;

class PreviewDataSingleton {
    private instance: PreviewData;
    private initializationPromise: PreviewDataRequest | undefined;
    constructor() {
        this.instance = null;
        this.initializationPromise = undefined;
    }

    private async initialize(): PreviewDataRequest {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            return get<PreviewData>('/api/admin/get-preview', accessToken);
        }
        throw Error('Missing access token');
    }

    async getData(): PreviewDataRequest {
        if (this.instance) {
            return this.instance;
        }
        if (!this.initializationPromise) {
            this.initializationPromise = this.initialize().then((instance: PreviewData) => {
                this.instance = instance;
                this.initializationPromise = undefined;
                return instance;
            });
        }
        return this.initializationPromise;
    }
}

export const previewDataSingleton = new PreviewDataSingleton();
