import {PlatformWebsiteUrl} from 'infra-common/system/Domain';
import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {get} from '@/utils/ClientApi';

export type SystemInfoData = {
    platformWebsiteUrl?: PlatformWebsiteUrl;
    defaultWebsiteUrl?: string;
} | null;
export type SystemInfoDataRequest = Promise<SystemInfoData>;

class SystemInfoDataSingleton {
    private dataInstance: SystemInfoData;
    private dataPromise: SystemInfoDataRequest | undefined;

    constructor() {
        this.dataInstance = null;
        this.dataPromise = undefined;
    }

    public async getData(): SystemInfoDataRequest {
        if (this.dataInstance) {
            return this.dataInstance;
        }
        if (!this.dataPromise) {
            this.dataPromise = (async () => {
                const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
                if (accessToken) {
                    this.dataInstance = {};
                    const platformWebsiteUrl = await get<PlatformWebsiteUrl>('/api/admin/get-website-url', accessToken);
                    if (platformWebsiteUrl) {
                        this.dataInstance.platformWebsiteUrl = platformWebsiteUrl;
                        this.dataInstance.defaultWebsiteUrl = `https://${platformWebsiteUrl.entryPointDomain}`;
                    }
                    this.dataPromise = undefined;
                    return this.dataInstance;
                } else {
                    throw Error('Missing access token');
                }
            })().catch((e: any) => {
                this.dataPromise = undefined;
                this.dataInstance = null;
                throw e;
            });
        }
        return this.dataPromise;
    }

    invalidateData(): void {
        this.dataInstance = null;
    }
}

export const systemInfoDataSingleton = new SystemInfoDataSingleton();
