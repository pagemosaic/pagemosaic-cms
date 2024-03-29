import {get} from '@/utils/ClientApi';
import {AccessToken, accessTokenSingleton} from '@/utils/AccessTokenSingleton';

export type GalleryItem = {
    title: string;
    description: string;
    imageUrl: string;
    downloadUrl: string;
    repository: string;
    demoUrl: string;
};

export type GalleryIndex = Array<GalleryItem>;

export type GalleryData = {index: GalleryIndex} | null;
export type GalleryDataRequest = Promise<GalleryData>;

class GalleryDataSingleton {
    private instance: GalleryData;
    private instancePromise: GalleryDataRequest | undefined;
    constructor() {
        this.instance = null;
        this.instancePromise = undefined;
    }

    async getData(): GalleryDataRequest {
        if (this.instance) {
            return this.instance;
        }
        if (!this.instancePromise) {
            this.instancePromise = (async () => {
                const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
                if (!accessToken) {
                    throw Error('Missing access token');
                }
                const galleryIndex = await get<GalleryIndex>(
                    '/api/admin/get-templates-websites-gallery-index',
                    accessToken
                );
                this.instance = galleryIndex
                    ? {index: galleryIndex}
                    : null;
                this.instancePromise = undefined;
                return this.instance;
            })().catch((e: any) => {
                this.instancePromise = undefined;
                throw e;
            });
        }
        return this.instancePromise;
    }
}

export const galleryDataSingleton = new GalleryDataSingleton();
