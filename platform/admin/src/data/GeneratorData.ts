import {toast} from 'sonner';
import {DI_PageEntry, DI_TemplateEntry, DI_Generator} from 'infra-common/data/DocumentItem';
import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {get, post, putFile1} from '@/utils/ClientApi';
import {SiteData} from '@/data/SiteData';
import {defaultRobots} from 'infra-common/utility/defaultInitialFiles';
import {getIdFromPK, getNormalizedRoute} from 'infra-common/utility/database';
import {
    DI_DELETED_PAGE_ENTRY_TYPE,
    BUCKET_ASSETS_DIR,
    BUCKET_STATIC_DIR,
    GENERATOR_RUNNING_STATUS
} from 'infra-common/constants';
import {
    localHtmlGeneratorSingleton,
    SiteFiles,
    PageFiles,
    PageContext,
    SiteContext,
    PageBasicContext
} from '@/utils/LocalHtmlGenerator';
import {FileObject} from 'infra-common/system/Bucket';
import {pagesDataSingleton} from '@/data/PagesData';
import {formatDate} from '@/utils/FormatUtils';
import {hashString} from '@/utils/CryptoUtils';

export type GeneratorData = {
    generator: DI_Generator;
} | null;
export type GeneratorDataRequest = Promise<GeneratorData>;

const wrappedProgressCB = (progress: number, cancel: () => void) => {
};

class GeneratorDataSingleton {
    private dataInstance: GeneratorData;
    private dataPromise: GeneratorDataRequest | undefined;
    private publishingPromise: Promise<void> | undefined;

    constructor() {
        this.dataInstance = null;
        this.dataPromise = undefined;
        this.publishingPromise = undefined;
        this.fetchTemplateEntry = this.fetchTemplateEntry.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
    }

    private async fetchTemplateEntry(templateId: string): Promise<DI_TemplateEntry | null> {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            const templateEntry = await get<DI_TemplateEntry>(`/api/admin/get-template?templateId=${templateId}`, accessToken);
            if (!templateEntry) {
                throw Error('Template was not found.');
            }
            return templateEntry;
        }
        throw Error('Missing access token');
    }

    private async uploadFile(fileBody: string, filePath: string, contentType: string): Promise<boolean> {
        const filePathParts = filePath.split('/');
        if (filePathParts.length === 0) {
            throw Error('Publishing file paths has the wrong format');
        }
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (!accessToken) {
            throw Error('Missing access token');
        }
        const contentHash = await hashString(fileBody);
        const postResult = await post<{ url: string }>('/api/admin/post-add-public-file', {filePath, contentHash}, accessToken);
        if (postResult && postResult.url) {
            // Create a blob from the string body with the specified content type
            const blob = new Blob([fileBody], { type: contentType });
            // Create a File object from the blob
            const file = new File([blob], filePathParts[filePathParts.length - 1], { type: contentType });
            await putFile1(postResult.url, file, wrappedProgressCB);
            return true;
        }
        return false;
    }

    async publishChanges(websiteDomain: string): Promise<void> {
        if (!this.publishingPromise) {
            this.invalidateData();
            const generatorData = await this.getGenerator();
            if (!generatorData || !generatorData.generator.Status || generatorData.generator.Status.State.S === GENERATOR_RUNNING_STATUS) {
                throw Error('The previous files publishing is not finished yet');
            }
            const pagesData = await pagesDataSingleton.getPagesData();
            if (pagesData) {
                if (pagesData.pageEntries.length > 50000) {
                    throw Error('It seems that there are more than 50000 pages.');
                }
                const foundIndexPage = pagesData.pageEntries.find(i => i.Meta?.PageSlug.S === 'index');
                const foundError404Page = pagesData.pageEntries.find(i => i.Meta?.PageSlug.S === 'error404');
                let errorMessage = '';
                if (!foundIndexPage) {
                    errorMessage += 'Please create a page with slug "index" for the website home page.';
                }
                if (!foundError404Page) {
                    errorMessage += errorMessage.length > 0 ? ' ' : '';
                    errorMessage += 'Please create a page with slug "error404" for the website 404 error.';
                }
                if (errorMessage.length > 0) {
                    throw Error(errorMessage);
                }
            }
            const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
            let invalidatePaths: Array<string> = [];
            let filesMap: Record<string, boolean> = {};
            if (accessToken) {
                this.publishingPromise = (async () => {
                    try {
                        const filesInBucket = await post<Array<FileObject>>('/api/admin/post-generation-start', {}, accessToken) || [];
                        if (filesInBucket && filesInBucket.length > 0) {
                            for (const fileItem of filesInBucket.filter(file => !file.id.startsWith(BUCKET_ASSETS_DIR) && !file.id.startsWith(BUCKET_STATIC_DIR))) {
                                filesMap[fileItem.id] = true;
                            }
                        }
                        const pageEntries = await get<Array<DI_PageEntry>>(
                            '/api/admin/get-pages',
                            accessToken
                        );
                        const siteData = await get<SiteData>(
                            '/api/admin/get-site',
                            accessToken
                        );

                        if (!siteData) {
                            throw Error('Missing global site data entry');
                        }

                        const {siteEntry} = siteData;

                        if (siteEntry && pageEntries) {
                            const linkedPages: Record<string, PageBasicContext> = {};
                            for (const pageEntry of pageEntries) {
                                const pageId = getIdFromPK(pageEntry.Entry?.PK.S);
                                const route = getNormalizedRoute(pageEntry.Meta?.PageRoute.S) + pageEntry.Meta?.PageSlug.S;
                                if (pageEntry.Entry?.EntryType.S !== DI_DELETED_PAGE_ENTRY_TYPE) {
                                    linkedPages[pageId] = {
                                        id: pageId,
                                        title: pageEntry.Meta?.PageTitle.S || 'Undefined Page Title',
                                        route,
                                        slug: pageEntry.Meta?.PageSlug.S || '',
                                        templateId: pageEntry.Meta?.PageTemplateId.S || '',
                                        excludeFromSitemap: pageEntry.Meta?.ExcludeFromSitemap?.S === 'true',
                                        updated: formatDate(Number(pageEntry.Entry?.EntryUpdateDate.N))
                                    };
                                }
                            }

                            const {SiteStyles, SiteContent, SitePartials} = siteEntry;
                            let partials: Record<string, string> = {};
                            if (SitePartials && SitePartials.length > 0) {
                                for (const sitePartial of SitePartials) {
                                    partials[sitePartial.SitePartialKey.S] = sitePartial.SitePartialContentData.S;
                                }
                            }
                            const site: SiteContext = {
                                url: `https://${websiteDomain}`,
                                domain: websiteDomain,
                                pages: linkedPages,
                                blocks: JSON.parse(SiteContent?.SiteContentData.S || '[]'),
                                partials
                            };
                            const siteFiles: SiteFiles = await localHtmlGeneratorSingleton.generateSiteFiles(
                                site,
                                SiteStyles || ''
                            );

                            if (await this.uploadFile(
                                siteFiles.styles.fileBody,
                                siteFiles.styles.filePath,
                                'text/css'
                            )) {
                                invalidatePaths.push(siteFiles.styles.filePath);
                                toast.success(
                                    'The global styles has been published successfully'
                                );
                            }
                            delete filesMap[siteFiles.styles.filePath];

                            if (await this.uploadFile(
                                siteFiles.sitemap.fileBody,
                                siteFiles.sitemap.filePath,
                                'text/xml'
                            )) {
                                invalidatePaths.push(siteFiles.sitemap.filePath);
                                toast.success(
                                    'The sitemap file has been published successfully'
                                );
                            }
                            delete filesMap[siteFiles.sitemap.filePath];

                            const templatesMap: Record<string, DI_TemplateEntry> = {};
                            let runningTasks: Array<Promise<any>> = [];
                            for (const pageEntry of pageEntries) {
                                if (runningTasks.length >= 3) {
                                    await Promise.race(runningTasks);
                                }
                                const workTask = (async () => {
                                    const fullPageEntry = await get<DI_PageEntry>(
                                        `/api/admin/get-full-page?pageId=${getIdFromPK(pageEntry.Entry?.PK.S)}`,
                                        accessToken
                                    );
                                    if (!fullPageEntry) {
                                        return;
                                    }
                                    const {Entry, Meta, Article, Content} = fullPageEntry;
                                    if (SiteContent && Entry && Meta && Article && Content) {
                                        if (Entry.EntryType.S !== DI_DELETED_PAGE_ENTRY_TYPE) {
                                            const templateId = Meta.PageTemplateId.S;
                                            let templateEntry: DI_TemplateEntry | null = templatesMap[templateId];
                                            if (!templateEntry) {
                                                templateEntry = await this.fetchTemplateEntry(templateId);
                                                if (templateEntry) {
                                                    templatesMap[templateId] = templateEntry;
                                                }
                                            }
                                            if (templateEntry) {
                                                const {Styles, Html} = templateEntry;
                                                const thisPage: PageContext = {
                                                    id: getIdFromPK(Entry.PK.S),
                                                    templateId,
                                                    title: Meta.PageTitle.S || '',
                                                    route: getNormalizedRoute(Meta.PageRoute.S) + Meta.PageSlug.S,
                                                    slug: Meta.PageSlug.S,
                                                    blocks: JSON.parse(Content.PageContentData.S || '[]'),
                                                    excludeFromSitemap: Meta.ExcludeFromSitemap?.S === 'true',
                                                    updated: formatDate(Number(Entry.EntryUpdateDate.N))
                                                };
                                                const pageFiles: PageFiles = await localHtmlGeneratorSingleton.generatePageFiles({
                                                    site,
                                                    thisPage,
                                                    markdown: Article.PageArticleData.S || '',
                                                    html: Html || '',
                                                    styles: Styles || '',
                                                    // siteScripts: siteFiles.siteScripts,
                                                    // siteBodyScripts: siteFiles.siteBodyScripts,
                                                    siteStyles: siteFiles.styles.url
                                                });

                                                let uploadedFilesCounter = 0;
                                                if (await this.uploadFile(
                                                    pageFiles.styles.fileBody,
                                                    pageFiles.styles.filePath,
                                                    'text/css'
                                                )) {
                                                    invalidatePaths.push(pageFiles.styles.filePath);
                                                    uploadedFilesCounter++;
                                                }
                                                if (await this.uploadFile(
                                                    pageFiles.html.fileBody,
                                                    pageFiles.html.filePath,
                                                    'text/html'
                                                )) {
                                                    invalidatePaths.push(pageFiles.html.filePath);
                                                    uploadedFilesCounter++;
                                                }
                                                delete filesMap[pageFiles.styles.filePath];
                                                delete filesMap[pageFiles.html.filePath];
                                                if (uploadedFilesCounter > 0) {
                                                    toast.success(
                                                        'The page has been published successfully', {
                                                            description: thisPage.title
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    }
                                })().finally(() => {
                                    runningTasks = runningTasks.filter(p => p !== workTask);
                                });
                                runningTasks.push(workTask);
                            }
                            await Promise.all(runningTasks);
                        }
                        if (await this.uploadFile(
                            defaultRobots,
                            'robots.txt',
                            'text/plain'
                        )) {
                            invalidatePaths.push('robots.txt');
                        }
                        delete filesMap['robots.txt'];
                        await post('/api/admin/post-generation-end', {
                            deletePaths: Object.keys(filesMap),
                            invalidatePaths
                        }, accessToken);
                    } catch (e: any) {
                        console.error(e);
                        toast.error('Publishing error', {
                            description: e.message
                        });
                        await post('/api/admin/post-generation-end', {
                            deletePaths: [],
                            invalidatePaths: []
                        }, accessToken);

                    } finally {
                    }
                })().finally(async () => {
                    this.invalidateData();
                    this.publishingPromise = undefined;
                });
            } else {
                throw Error('Missing access token');
            }
        }
        return this.publishingPromise;
    }

    public async getGenerator(): GeneratorDataRequest {
        if (this.dataInstance) {
            return this.dataInstance;
        }
        if (!this.dataPromise) {
            this.dataPromise = (async () => {
                const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
                if (!accessToken) {
                    throw Error('Missing access token');
                }
                const generator = await get<DI_Generator>(
                    '/api/admin/get-generator',
                    accessToken
                );
                if (generator?.Status) {
                    this.dataInstance = {
                        generator
                    };
                } else {
                    this.dataInstance = null;
                }
                this.dataPromise = undefined;
                return this.dataInstance;
            })().catch(e => {
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

// Usage
export const generatorDataSingleton = new GeneratorDataSingleton();
