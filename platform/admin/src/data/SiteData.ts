import {DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {get, post} from '@/utils/ClientApi';
import {getSessionState, setSessionState, delSessionState} from '@/utils/localStorage';
import {generatorDataSingleton} from '@/data/GeneratorData';

export type SiteDataStatus = 'changed' | 'saved';
export type SiteDataSessionKeys = {
    tempSiteSessionKey: string;
    savedSiteSessionKey: string;
};
export type SiteData = { siteEntry: DI_SiteEntry; } | null;
export type SiteDataRequest = Promise<SiteDataSessionKeys>;

class SiteDataSingleton {
    private dataCache: SiteData;
    private dataPromise: Promise<SiteData> | undefined;
    constructor() {
        this.dataCache = null;
        this.dataPromise = undefined;
    }

    private async fetchSiteData(): Promise<SiteData> {
        if (this.dataCache) {
            return this.dataCache;
        }
        if (!this.dataPromise) {
            const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
            if (accessToken) {
                this.dataPromise = get<SiteData>(
                    '/api/admin/get-site',
                    accessToken
                )
                    .then((data) => {
                        this.dataPromise = undefined;
                        if (!data) {
                            throw Error('Site data was not found');
                        }
                        this.dataCache = data;
                        return this.dataCache;
                    })
                    .catch(e => {
                        this.dataPromise = undefined;
                        throw e;
                    });
            } else {
                throw Error('Missing access token');
            }
        }
        return this.dataPromise;
    }

    public getStateKeys(): SiteDataSessionKeys {
        return {
            savedSiteSessionKey: 'siteEntry_saved',
            tempSiteSessionKey: 'siteEntry_temp'
        };
    }

    public getTempSite(): DI_SiteEntry | undefined {
        const siteSessionKeys = this.getStateKeys();
        return getSessionState<DI_SiteEntry>(siteSessionKeys.tempSiteSessionKey);
    }

    public async getEditSite(): SiteDataRequest {
        const siteSessionKeys = this.getStateKeys();
        const siteData = await this.fetchSiteData();
        setSessionState(siteSessionKeys.savedSiteSessionKey, siteData?.siteEntry);
        const foundSiteTemp = getSessionState<DI_SiteEntry>(siteSessionKeys.tempSiteSessionKey);
        if (!foundSiteTemp) {
            setSessionState(siteSessionKeys.tempSiteSessionKey, siteData?.siteEntry);
        }
        return siteSessionKeys;
    }

    public async saveSite(): Promise<void> {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            const sessionKeys = this.getStateKeys();
            const {
                tempSiteSessionKey,
                savedSiteSessionKey
            } = sessionKeys;
            const foundSiteSaved = getSessionState<DI_SiteEntry>(savedSiteSessionKey);
            const foundSiteTemp = getSessionState<DI_SiteEntry>(tempSiteSessionKey);
            if (foundSiteSaved && foundSiteTemp) {
                if (foundSiteSaved.Entry?.EntryUpdateDate.N !== foundSiteTemp.Entry?.EntryUpdateDate.N) {
                    await post<any>('/api/admin/post-site', {site: foundSiteTemp}, accessToken);
                }
            }
            this.dataCache = null;
            delSessionState(tempSiteSessionKey);
            delSessionState(savedSiteSessionKey);
            generatorDataSingleton.invalidateData();
            return;
        }
        throw Error('Missing access token');
    }

    public revertChanges(): void {
        const sessionKeys = this.getStateKeys();
        const {tempSiteSessionKey} = sessionKeys;
        const foundSiteTemp = getSessionState<DI_SiteEntry>(tempSiteSessionKey);
        if (foundSiteTemp) {
            delSessionState(tempSiteSessionKey);
        }
    }

    public getStatus(): SiteDataStatus {
        let result: SiteDataStatus = 'saved';
        const sessionKeys = this.getStateKeys();
        const {
            tempSiteSessionKey,
            savedSiteSessionKey
        } = sessionKeys;
        const foundSiteSaved = getSessionState<DI_SiteEntry>(savedSiteSessionKey);
        const foundSiteTemp = getSessionState<DI_SiteEntry>(tempSiteSessionKey);
        if (foundSiteSaved && foundSiteTemp) {
            if (foundSiteSaved.Entry?.EntryUpdateDate.N !== foundSiteTemp.Entry?.EntryUpdateDate.N) {
                result = 'changed';
            }
        }
        return result;
    }

    public async getSiteData(): Promise<SiteData> {
        const sessionKeys = this.getStateKeys();
        const {tempSiteSessionKey} = sessionKeys;
        const foundSiteTemp = getSessionState<DI_SiteEntry>(tempSiteSessionKey);
        let siteData: SiteData;
        if (foundSiteTemp) {
            siteData = await new Promise<SiteData>(resolve => setTimeout(() => resolve({
                siteEntry: foundSiteTemp,
            }), 200));
        } else {
            siteData = await this.fetchSiteData();
        }
        return siteData;
    }

    public invalidateData(): void {
        this.dataCache = null;
    }

}

export const siteDataSingleton = new SiteDataSingleton();
