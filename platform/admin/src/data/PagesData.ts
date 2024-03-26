import {nanoid} from 'nanoid';
import {DI_PageEntry, DI_TemplateEntry, DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {get, post} from '@/utils/ClientApi';
import {generatorDataSingleton} from '@/data/GeneratorData';
import {pageDataSingleton, PageDataStatus} from '@/data/PageData';
import {getIdFromPK} from 'infra-common/utility/database';
import {PagesNode, listToTree, setParentReferences} from './PagesData.utility';
import {SiteDataStatus, siteDataSingleton} from '@/data/SiteData';
import {toast} from 'sonner';
import {historyDataSingleton} from '@/data/HistoryData';

export type PagesRoots = Array<PagesNode>;
export type PagesData = {
    siteEntry: DI_SiteEntry | null;
    pagesRoots: PagesRoots;
    templateEntries: Array<DI_TemplateEntry>;
    pageEntries: Array<DI_PageEntry>;
} | null;
export type PagesDataRequest = Promise<PagesData>;

class PagesDataSingleton {
    private dataInstance: PagesData;
    private dataPromise: PagesDataRequest | undefined;
    private pageDataPromise: Promise<void> | undefined;
    constructor() {
        this.dataInstance = null;
        this.dataPromise = undefined;
        this.pageDataPromise = undefined;
    }

    public async getPagesData(): PagesDataRequest {
        if (this.dataInstance) {
            return this.dataInstance;
        }
        if (!this.dataPromise) {
            const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
            if (accessToken) {
                this.dataPromise = (async () => {
                    this.dataInstance = null;
                    const [siteEntry, pageEntries, templateEntries] = await Promise.all([
                        get<DI_SiteEntry>(
                            '/api/admin/get-site-entry',
                            accessToken
                        ),
                        get<Array<DI_PageEntry>>(
                            '/api/admin/get-pages',
                            accessToken
                        ),
                        get<Array<DI_TemplateEntry>>(
                            '/api/admin/get-templates',
                            accessToken
                        )
                    ]);
                    let pagesRoots: Array<PagesNode> = [];
                    if (pageEntries && templateEntries) {
                        let sortedPageEntries = pageEntries.sort((a, b) => {
                            const titleA = a.Meta?.PageTitle?.S.toLowerCase() ?? '';
                            const titleB = b.Meta?.PageTitle?.S.toLowerCase() ?? '';
                            if (titleA < titleB) {
                                return -1;
                            }
                            if (titleA > titleB) {
                                return 1;
                            }
                            return 0;
                        });
                        pagesRoots = listToTree(sortedPageEntries, templateEntries);
                        if (pagesRoots && pagesRoots.length > 0) {
                            for (const pagesRoot of pagesRoots) {
                                setParentReferences(pagesRoot);
                            }
                        }
                    }
                    this.dataInstance = {
                        siteEntry,
                        pagesRoots,
                        templateEntries: templateEntries || [],
                        pageEntries: pageEntries || []
                    };
                    this.dataPromise = undefined;
                    return this.dataInstance;
                })().catch((e: any) => {
                    this.dataInstance = null;
                    this.dataPromise = undefined;
                    throw e;
                });
            } else {
                throw Error('Missing access token');
            }
        }
        return this.dataPromise;
    }

    public async copyPage(pageId: string, templateId: string, pageRoute?: string): Promise<string> {
        const accessToken: AccessToken= await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            const newPageId = nanoid();
            await post<any>('/api/admin/post-copy-page', {pageId, newPageId, pageRoute}, accessToken);
            await this.invalidatePageData(newPageId, templateId);
            generatorDataSingleton.invalidateData();
            return newPageId;
        }
        throw Error('Missing access token');
    }

    public async createPage(templateId: string, pageRoute: string, newTemplateTitle?: string): Promise<string> {
        const accessToken: AccessToken= await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            const newPageId = nanoid();
            let newTemplateId: string | undefined = undefined;
            if (newTemplateTitle) {
                newTemplateId = nanoid();
            }
            await post<any>('/api/admin/post-create-page', {templateId, newPageId, newTemplateId, newTemplateTitle, pageRoute}, accessToken);
            await this.invalidatePageData(newPageId, newTemplateId || templateId);
            generatorDataSingleton.invalidateData();
            return newPageId;
        }
        throw Error('Missing access token');
    }

    public async deletePage(pageId: string, templateId: string): Promise<void> {
        const accessToken: AccessToken= await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            await post<any>('/api/admin/post-delete-page', {pageId, templateId}, accessToken);
            generatorDataSingleton.invalidateData();
            this.invalidateData();
        } else {
            throw Error('Missing access token');
        }
    }

    public async updateTemplateTitle(templateId: string, newTitle: string): Promise<void> {
        const accessToken: AccessToken= await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            await post<any>('/api/admin/post-template-title', {templateId, newTitle}, accessToken);
            this.invalidateData();
        } else {
            throw Error('Missing access token');
        }
    }

    public async saveChanges(): Promise<void> {
        let status: SiteDataStatus | PageDataStatus = siteDataSingleton.getStatus();
        if (status === 'changed') {
            await siteDataSingleton.saveSite();
        }
        if (this.dataInstance) {
            let status: PageDataStatus;
            const {pageEntries = []} = this.dataInstance;
            const templateIds: Array<string> = [];
            let pageId: string;
            let templateId: string;
            for (const pageEntry of pageEntries) {
                pageId = getIdFromPK(pageEntry.Entry?.PK.S);
                templateId = pageEntry.Meta?.PageTemplateId.S || '';
                status = pageDataSingleton.getStatus(pageId, templateId);
                if (status === 'changed') {
                    templateIds.push(templateId);
                    await pageDataSingleton.savePage(pageId);
                    historyDataSingleton.deleteFromHistory(pageId);
                }
            }
            for (const saveTemplateId of templateIds) {
                await pageDataSingleton.saveTemplate(saveTemplateId);
            }
            this.invalidateData();
            generatorDataSingleton.invalidateData();
        }
    }

    public revertChanges(): void {
        let status: SiteDataStatus | PageDataStatus = siteDataSingleton.getStatus();
        if (status === 'changed') {
            siteDataSingleton.revertChanges();
        }
        if (this.dataInstance) {
            let status: PageDataStatus;
            const {pageEntries = []} = this.dataInstance;
            const templateIds: Array<string> = [];
            let pageId: string;
            let templateId: string;
            for (const pageEntry of pageEntries) {
                pageId = getIdFromPK(pageEntry.Entry?.PK.S);
                templateId = pageEntry.Meta?.PageTemplateId.S || '';
                status = pageDataSingleton.getStatus(pageId, templateId);
                if (status === 'changed') {
                    templateIds.push(templateId);
                    pageDataSingleton.revertPage(pageId);
                    historyDataSingleton.deleteFromHistory(pageId);
                }
            }
            for (const saveTemplateId of templateIds) {
                pageDataSingleton.revertTemplate(saveTemplateId);
            }
            this.invalidateData();
            setTimeout(() => {
                toast.success('The changes has been successfully reverted');
            }, 1000);
        }
    }

    public invalidateData(): void {
        this.dataInstance = null;
    }

    public async invalidatePageData(pageId: string, templateId: string): Promise<void> {
        if (!this.dataInstance) {
            return;
        }
        if (!this.pageDataPromise) {
            this.pageDataPromise = (async () => {
                const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
                if (accessToken) {
                    const [pageEntry, templateEntry] = await Promise.all([
                        get<DI_PageEntry>(
                            `/api/admin/get-page?pageId=${pageId}`,
                            accessToken
                        ),
                        get<DI_TemplateEntry>(
                            `/api/admin/get-template?templateId=${templateId}`,
                            accessToken
                        )
                    ]);
                    if (pageEntry && templateEntry && this.dataInstance) {
                        const {siteEntry, pageEntries = [], templateEntries = []} = this.dataInstance;
                        const foundPageEntryIndex = pageEntries.findIndex(i => i.Entry?.PK.S === pageEntry.Entry?.PK.S);
                        const foundTemplateEntryIndex = templateEntries.findIndex((i => i.Entry?.PK.S === templateEntry.Entry?.PK.S));
                        if (foundPageEntryIndex >= 0) {
                            pageEntries.splice(foundPageEntryIndex, 1, pageEntry);
                        } else {
                            pageEntries.push(pageEntry);
                        }
                        if (foundTemplateEntryIndex >= 0) {
                            templateEntries.splice(foundTemplateEntryIndex, 1, templateEntry);
                        } else {
                            templateEntries.push(templateEntry);
                        }
                        let pagesRoots: Array<PagesNode> = [];
                        let sortedPageEntries = pageEntries.sort((a, b) => {
                            const titleA = a.Meta?.PageTitle?.S.toLowerCase() ?? '';
                            const titleB = b.Meta?.PageTitle?.S.toLowerCase() ?? '';
                            if (titleA < titleB) {
                                return -1;
                            }
                            if (titleA > titleB) {
                                return 1;
                            }
                            return 0;
                        });
                        pagesRoots = listToTree(sortedPageEntries, templateEntries);
                        if (pagesRoots && pagesRoots.length > 0) {
                            for (const pagesRoot of pagesRoots) {
                                setParentReferences(pagesRoot);
                            }
                        }
                        this.dataInstance = {
                            siteEntry,
                            pagesRoots,
                            templateEntries,
                            pageEntries
                        };
                    }
                    this.pageDataPromise = undefined;
                } else {
                    throw Error('Missing access token');
                }
            })().catch((e: any) => {
                this.pageDataPromise = undefined;
                throw e;
            });
        }
        return this.pageDataPromise;
    }
}

// Usage
export const pagesDataSingleton = new PagesDataSingleton();
