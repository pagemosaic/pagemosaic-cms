import {DI_PageEntry, DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {get, post} from '@/utils/ClientApi';
import {setSessionState, delSessionState, getSessionState} from '@/utils/localStorage';
import {pagesDataSingleton, PagesData} from '@/data/PagesData';
import {getIdFromPK, getNormalizedRoute, fixIndexRoute} from 'infra-common/utility/database';
import {localHtmlGeneratorSingleton, PageContext, SiteContext, PageBasicContext} from '@/utils/LocalHtmlGenerator';
import {systemInfoDataSingleton, SystemInfoData} from '@/data/SystemInfoData';
import {SiteData} from '@/data/SiteData';
import {formatDate} from '@/utils/FormatUtils';
import {generatorDataSingleton} from '@/data/GeneratorData';

export type PageDataCache = Record<string, PageData>;
export type PageDataStatus = 'changed' | 'saved';
export type PageDataPageStateKeys = {
    tempPageSessionKey: string;
    savedPageSessionKey: string;
};
export type PageDataTemplateStateKeys = {
    tempTemplateSessionKey: string;
    savedTemplateSessionKey: string;
};
export type PageDataSessionKeys = PageDataPageStateKeys & PageDataTemplateStateKeys;
export type PageData = { pageEntry: DI_PageEntry; templateEntry: DI_TemplateEntry; };
export type PageDataRequest = Promise<PageDataSessionKeys>;
export type PagePreviewHtml = {
    title: string;
    html: string;
};

class PageDataSingleton {
    private pageDataCache: PageDataCache;
    private getPagePromise: Promise<PageData> | undefined;
    private getPreviewHtmlPromise: Promise<PagePreviewHtml> | undefined;
    private getEditPagePromise: PageDataRequest | undefined;

    constructor() {
        this.pageDataCache = {};
        this.getPagePromise = undefined;
        this.getPreviewHtmlPromise = undefined;
        this.getEditPagePromise = undefined;
    }

    private async fetchPageData(pageId: string): Promise<PageData> {
        if (!this.pageDataCache[pageId]) {
            const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
            if (accessToken) {
                const pageEntry = await get<DI_PageEntry>(`/api/admin/get-full-page?pageId=${pageId}`, accessToken);
                if (!pageEntry) {
                    throw Error('Page was not found.');
                }
                const {Meta} = pageEntry;
                const templateId = Meta?.PageTemplateId.S;
                if (!templateId) {
                    throw Error('Page is not connected to the template.');
                }
                const templateEntry = await get<DI_TemplateEntry>(`/api/admin/get-template?templateId=${templateId}`, accessToken);
                if (!templateEntry) {
                    throw Error('Template was not found.');
                }
                this.pageDataCache[pageId] = {
                    pageEntry,
                    templateEntry
                };
            } else {
                throw Error('Missing access token');
            }
        }
        return this.pageDataCache[pageId];
    }

    public getPageStateKeys(pageId: string): PageDataPageStateKeys {
        const editPageSessionStateKey = `pageEntry_${pageId}`;
        const savedPageSessionKey = `${editPageSessionStateKey}_saved`;
        const tempPageSessionKey = `${editPageSessionStateKey}_temp`;
        return {
            savedPageSessionKey,
            tempPageSessionKey
        };
    }

    public getTemplateStateKeys(templateId: string): PageDataTemplateStateKeys {
        const editTemplateSessionStateKey = `templateEntry_${templateId}`;
        const savedTemplateSessionKey = `${editTemplateSessionStateKey}_saved`;
        const tempTemplateSessionKey = `${editTemplateSessionStateKey}_temp`;
        return {
            savedTemplateSessionKey,
            tempTemplateSessionKey
        };
    }

    public getStateKeys(pageId: string, templateId: string): PageDataSessionKeys {
        return {
            ...this.getPageStateKeys(pageId),
            ...this.getTemplateStateKeys(templateId)
        };
    }

    public getTempTemplateEntry(templateId: string): DI_TemplateEntry | undefined {
        const sessionKeys = this.getTemplateStateKeys(templateId);
        return getSessionState<DI_TemplateEntry>(sessionKeys.tempTemplateSessionKey);
    }

    public async getEditPage(options: { pageId: string; }): PageDataRequest {
        if (!this.getEditPagePromise) {
            this.getEditPagePromise = (async () => {
                const {pageId} = options;
                const {pageEntry, templateEntry} = await this.fetchPageData(pageId);
                const templateId = getIdFromPK(templateEntry.Entry?.PK.S);
                const sessionKeys = this.getStateKeys(pageId, templateId);
                setSessionState(sessionKeys.savedPageSessionKey, pageEntry);
                setSessionState(sessionKeys.savedTemplateSessionKey, templateEntry);
                const foundPageTemp = getSessionState<DI_PageEntry>(sessionKeys.tempPageSessionKey);
                if (!foundPageTemp || getIdFromPK(foundPageTemp.Entry?.PK.S) !== pageId) {
                    setSessionState(sessionKeys.tempPageSessionKey, pageEntry);
                }
                const foundTemplateTemp = getSessionState<DI_TemplateEntry>(sessionKeys.tempTemplateSessionKey);
                if (!foundTemplateTemp || getIdFromPK(foundTemplateTemp.Entry?.PK.S) !== templateId) {
                    setSessionState(sessionKeys.tempTemplateSessionKey, templateEntry);
                }
                this.getEditPagePromise = undefined;
                return sessionKeys;
            })().catch((e: any) => {
                this.getEditPagePromise = undefined;
                throw e;
            });
        }
        return this.getEditPagePromise;
    }

    public async savePage(pageId: string): Promise<void> {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            const sessionKeys = this.getPageStateKeys(pageId);
            const {
                tempPageSessionKey,
                savedPageSessionKey,
            } = sessionKeys;
            const foundPageSaved = getSessionState<DI_PageEntry>(savedPageSessionKey);
            const foundPageTemp = getSessionState<DI_PageEntry>(tempPageSessionKey);
            if (foundPageSaved && foundPageTemp) {
                if (foundPageSaved.Entry?.EntryUpdateDate.N !== foundPageTemp.Entry?.EntryUpdateDate.N) {
                    await post<any>('/api/admin/post-page', {page: foundPageTemp}, accessToken);
                }
                delSessionState(savedPageSessionKey);
                delSessionState(tempPageSessionKey);
            }
            delete this.pageDataCache[pageId];
            return;
        }
        throw Error('Missing access token');
    }

    public async saveTemplate(templateId: string): Promise<void> {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            const sessionKeys = this.getTemplateStateKeys(templateId);
            const {
                tempTemplateSessionKey,
                savedTemplateSessionKey
            } = sessionKeys;
            const foundTemplateSaved = getSessionState<DI_TemplateEntry>(savedTemplateSessionKey);
            const foundTemplateTemp = getSessionState<DI_TemplateEntry>(tempTemplateSessionKey);
            if (foundTemplateSaved && foundTemplateTemp) {
                if (foundTemplateSaved.Entry?.EntryUpdateDate.N !== foundTemplateTemp.Entry?.EntryUpdateDate.N) {
                    await post<any>('/api/admin/post-template', {template: foundTemplateTemp}, accessToken);
                }
                delSessionState(savedTemplateSessionKey);
                delSessionState(tempTemplateSessionKey);
            }
            return;
        }
        throw Error('Missing access token');
    }

    /**
     * Extremely specific method - it updates the page entry slice in the session but not sets that there is any changes in the page,
     * then it updates the pages data lists.
     * all these are for smooth preview of the not saved pages entries, and keep linked pages update (titles, routes) on all previews
     */
    public async savePageMeta(pageId: string, templateId: string, title: string, slug: string, excludeFromSitemap: string): Promise<void> {
        const sessionKeys = this.getPageStateKeys(pageId);
        const {
            tempPageSessionKey,
            savedPageSessionKey,
        } = sessionKeys;
        const foundPageSaved = getSessionState<DI_PageEntry>(savedPageSessionKey);
        const foundPageTemp = getSessionState<DI_PageEntry>(tempPageSessionKey);
        if (foundPageSaved?.Entry && foundPageTemp?.Entry && foundPageTemp?.Meta) {
            const newPageEntry: DI_PageEntry = {
                Entry: foundPageTemp.Entry,
                Meta: {
                    ...foundPageTemp.Meta,
                    PageTitle: {S: title},
                    PageSlug: {S: slug},
                    ExcludeFromSitemap: {S: excludeFromSitemap === 'true' ? 'true' : 'false'}
                }
            };
            const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
            if (accessToken) {
                await post<any>('/api/admin/post-page', {page: newPageEntry}, accessToken);
            } else {
                throw Error('Missing access token');
            }
            await pagesDataSingleton.invalidatePageData(pageId, templateId);
            // save new meta into session only after all singletons are invalidated
            setSessionState(savedPageSessionKey, {...foundPageSaved, Meta: newPageEntry.Meta});
            // foundPageTemp.Entry.EntryUpdateDate.N = Date.now().toString(); // emulate not saved page for the user
            setSessionState(tempPageSessionKey, {...foundPageTemp, Meta: newPageEntry.Meta});
            generatorDataSingleton.invalidateData();
        } else {
            throw Error('Missing page data in session');
        }
    }

    public revertPage(pageId: string): void {
        const sessionKeys = this.getPageStateKeys(pageId);
        const {tempPageSessionKey} = sessionKeys;
        const foundPageTemp = getSessionState<DI_PageEntry>(tempPageSessionKey);
        if (foundPageTemp) {
            delSessionState(tempPageSessionKey);
        }
        delete this.pageDataCache[pageId];
    }

    public revertTemplate(templateId: string): void {
        const sessionKeys = this.getTemplateStateKeys(templateId);
        const {tempTemplateSessionKey} = sessionKeys;
        const foundTemplateTemp = getSessionState<DI_TemplateEntry>(tempTemplateSessionKey);
        if (foundTemplateTemp) {
            delSessionState(tempTemplateSessionKey);
        }
    }

    public getStatus(pageId: string, templateId: string): PageDataStatus {
        let result: PageDataStatus = 'saved';
        const sessionKeys = this.getStateKeys(pageId, templateId);
        const {tempPageSessionKey, savedPageSessionKey, tempTemplateSessionKey, savedTemplateSessionKey} = sessionKeys;
        const foundPageSaved = getSessionState<DI_PageEntry>(savedPageSessionKey);
        const foundPageTemp = getSessionState<DI_PageEntry>(tempPageSessionKey);
        const foundTemplateSaved = getSessionState<DI_TemplateEntry>(savedTemplateSessionKey);
        const foundTemplateTemp = getSessionState<DI_TemplateEntry>(tempTemplateSessionKey);
        if (foundPageSaved && foundPageTemp) {
            if (foundPageSaved.Entry?.EntryUpdateDate.N !== foundPageTemp.Entry?.EntryUpdateDate.N) {
                result = 'changed';
            }
        }
        if (foundTemplateSaved && foundTemplateTemp) {
            if (foundTemplateSaved.Entry?.EntryUpdateDate.N !== foundTemplateTemp.Entry?.EntryUpdateDate.N) {
                result = 'changed';
            }
        }
        return result;
    }

    public async getPage(pageId: string, templateId: string): Promise<PageData> {
        if (!this.getPagePromise) {
            this.getPagePromise = (async () => {
                const sessionKeys = this.getStateKeys(pageId, templateId);
                const {tempPageSessionKey, tempTemplateSessionKey} = sessionKeys;
                const foundPageTemp = getSessionState<DI_PageEntry>(tempPageSessionKey);
                const foundTemplateTemp = getSessionState<DI_TemplateEntry>(tempTemplateSessionKey);
                let pageData: PageData;
                if (foundPageTemp && foundTemplateTemp) {
                    pageData = await new Promise<PageData>(resolve => setTimeout(() => resolve({
                        pageEntry: foundPageTemp,
                        templateEntry: foundTemplateTemp
                    }), 200));
                } else {
                    pageData = await this.fetchPageData(pageId);
                }
                this.getPagePromise = undefined;
                return pageData;
            })().catch((e: any) => {
                this.getPagePromise = undefined;
                throw e;
            });
        }
        return this.getPagePromise;

    }

    public async getPreviewHtml(pageData: PageData, siteData: SiteData): Promise<PagePreviewHtml> {
        if (!this.getPreviewHtmlPromise) {
            this.getPreviewHtmlPromise = (async () => {
                const systemInfoData: SystemInfoData = await systemInfoDataSingleton.getData();
                const pagesData: PagesData = await pagesDataSingleton.getPagesData();
                if (systemInfoData && pagesData && siteData && pageData) {
                    const {defaultWebsiteUrl, platformWebsiteUrl} = systemInfoData;
                    const {siteEntry} = siteData;
                    const {pageEntry, templateEntry} = pageData;
                    const {Entry, Meta, Content, Article} = pageEntry;
                    const {Html, Styles} = templateEntry;
                    const {SiteContent, SiteStyles, SitePartials} = siteEntry;
                    if (SiteContent && Meta && Content && Article && defaultWebsiteUrl) {
                        const linkedPages: Record<string, PageBasicContext> = {};
                        if (pagesData?.pageEntries) {
                            let linkedPageId;
                            for (const pageEntry of pagesData.pageEntries) {
                                linkedPageId = getIdFromPK(pageEntry.Entry?.PK.S);
                                linkedPages[linkedPageId] = {
                                    id: linkedPageId,
                                    templateId: pageEntry.Meta?.PageTemplateId.S || '',
                                    title: pageEntry.Meta?.PageTitle.S || 'Undefined Page Title',
                                    route: fixIndexRoute(getNormalizedRoute(pageEntry.Meta?.PageRoute.S) + pageEntry.Meta?.PageSlug.S),
                                    slug: pageEntry.Meta?.PageSlug.S || '',
                                    excludeFromSitemap: pageEntry.Meta?.ExcludeFromSitemap?.S === 'true',
                                    updated: formatDate(Number(pageEntry.Entry?.EntryUpdateDate.N))
                                };
                            }
                        }
                        this.getPreviewHtmlPromise = undefined;
                        const thisPage: PageContext = {
                            id: getIdFromPK(Entry?.PK.S),
                            slug: Meta.PageSlug.S,
                            templateId: Meta.PageTemplateId.S || '',
                            title: Meta.PageTitle.S || '',
                            route: fixIndexRoute(getNormalizedRoute(Meta.PageRoute.S) + Meta.PageSlug.S),
                            blocks: JSON.parse(Content.PageContentData.S || '[]'),
                            excludeFromSitemap: Meta.ExcludeFromSitemap?.S === 'true',
                            updated: formatDate(Number(Entry?.EntryUpdateDate.N))
                        };
                        let domain = '';
                        if (platformWebsiteUrl) {
                            const {domain: mainDomain, entryPointDomain, entryPointDomainAlias} = platformWebsiteUrl;
                            domain = entryPointDomainAlias || mainDomain || entryPointDomain;
                        }
                        let partials: Record<string, string> = {};
                        if (SitePartials && SitePartials.length > 0) {
                            for (const sitePartial of SitePartials) {
                                partials[sitePartial.SitePartialKey.S] = sitePartial.SitePartialContentData.S;
                            }
                        }
                        const site: SiteContext = {
                            domain,
                            pages: linkedPages,
                            blocks: JSON.parse(SiteContent.SiteContentData.S || '[]'),
                            url: `https://${domain}`,
                            partials
                        }
                        return {
                            title: Meta.PageTitle.S,
                            html: await localHtmlGeneratorSingleton.generateHTML({
                                site,
                                thisPage,
                                html: Html ||  '<!doctype html><html></html>',
                                styles: Styles || '/* no styles */',
                                // siteScripts: SiteScripts,
                                // siteBodyScripts: SiteBodyScripts,
                                siteStyles: SiteStyles,
                                markdown: Article.PageArticleData.S || ''
                            })
                        };
                    }
                }
                this.getPreviewHtmlPromise = undefined;
                return {
                    title: 'Error',
                    html: '<html><body><p style="color: red; padding: 2em">Missing data for preview</p></body></html>',
                };
            })().catch((e: any) => {
                this.getPreviewHtmlPromise = undefined;
                throw e;
            });
        }
        return this.getPreviewHtmlPromise;
    }
}

export const pageDataSingleton = new PageDataSingleton();
