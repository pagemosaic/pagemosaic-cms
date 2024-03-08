import {Liquid} from 'liquidjs';
import {marked} from 'marked';
import template from 'lodash-es/template';
import {ContentData} from 'infra-common/data/ContentData';
import {BUCKET_GENERATED_DIR} from 'infra-common/constants';
import {getDenormalizedRoute} from 'infra-common/utility/database';

export interface SiteContext {
    domain: string;
    url: string; // https://domain.com
    blocks: ContentData;
    pages: Record<string, PageBasicContext>;
}

export interface PageBasicContext {
    id: string;
    templateId: string;
    slug: string;
    title: string;
    route: string; // /subroute/slug
    excludeFromSitemap: boolean;
    updated: string;
}

export interface PageContext extends PageBasicContext{
    blocks: ContentData;
    article?: string;
}

export interface PreviewProcessorProps {
    markdown: string;
    html: string;
    styles: string;
    siteStyles?: string;
    siteScripts?: string;
    siteBodyScripts?: string;
    thisPage: PageContext;
    site: SiteContext;
}

export type SiteFiles = {
    siteScripts?: string;
    siteBodyScripts?: string;
    styles: {
        url: string;
        filePath: string;
        fileBody: string;
    },
    sitemap: {
        filePath: string;
        fileBody: string;
    }
};

export type PageFiles = {
    html: {
        title: string;
        url: string;
        filePath: string;
        fileBody: string;
    },
    styles: {
        filePath: string;
        fileBody: string;
    }
};

const LiquidEngine = new Liquid({
    extname: '.html',
    cache: true,
    jsTruthy: true
});

const sitemapTemplate = template(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><% for (const [pageId, page] of Object.entries(pages)) { %><% if (!page.excludeFromSitemap) { %><loc><%= url %><%= page.route %></loc><lastmod><%= page.updated %></lastmod><% } %><% } %></url></urlset>
`);

class LocalHtmlGenerator {
    private htmlGeneratorPromise: Promise<string> | undefined;
    private pageFilesGeneratorPromise: Promise<PageFiles> | undefined;
    private siteFilesGeneratorPromise: Promise<SiteFiles> | undefined;

    constructor() {
        this.htmlGeneratorPromise = undefined;
        this.pageFilesGeneratorPromise = undefined;
        this.siteFilesGeneratorPromise = undefined;
    }

    public async generateHTML(props: PreviewProcessorProps): Promise<string> {
        if (!this.htmlGeneratorPromise) {
            this.htmlGeneratorPromise = (async () => {
                const {
                    site,
                    thisPage,
                    markdown,
                    html,
                    styles,
                    siteScripts,
                    siteBodyScripts,
                    siteStyles
                } = props;
                thisPage.article = await LiquidEngine.parseAndRender(marked.parse(markdown, {async: false}) as string, {
                    isDevMode: 'true',
                    site,
                    thisPage
                });
                const renderedPageStyles = styles
                    ? await LiquidEngine.parseAndRender(styles, {
                        isDevMode: 'true',
                        site,
                        thisPage
                    })
                    : '';
                const renderedSiteStyles = siteStyles
                    ? await LiquidEngine.parseAndRender(siteStyles, {
                        isDevMode: 'true',
                        site
                    })
                    : undefined;
                const renderedSiteScripts = siteScripts
                    ? await LiquidEngine.parseAndRender(siteScripts, {
                        isDevMode: 'true',
                        site
                    })
                    : '';
                const renderedSiteBodyScripts = siteBodyScripts
                    ? await LiquidEngine.parseAndRender(siteBodyScripts, {
                        isDevMode: 'true',
                        site
                    })
                    : '';
                const stylesTag = renderedSiteStyles
                    ? `<style>${renderedSiteStyles}</style>\n<style>${renderedPageStyles}</style>`
                    : `<style>${renderedPageStyles}</style>`;
                const rendered = await LiquidEngine.parseAndRender(html, {
                    isDevMode: 'true',
                    thisPage,
                    site,
                    styles: stylesTag,
                    headScripts: `<base href="https://${site.domain}/" />\n<base target="_blank" />\n${renderedSiteScripts}`,
                    bodyScripts: renderedSiteBodyScripts
                });
                this.htmlGeneratorPromise = undefined;
                return rendered;
            })().catch((e: any) => {
                this.htmlGeneratorPromise = undefined;
                return `<html><body><p style="color: red; padding: 2em">${e.message}</p></body></html>`;
            });
        }
        return this.htmlGeneratorPromise;
    }

    public async generatePageFiles(props: PreviewProcessorProps): Promise<PageFiles> {
        if (!this.pageFilesGeneratorPromise) {
            this.pageFilesGeneratorPromise = (async () => {
                const {
                    markdown,
                    html,
                    thisPage,
                    site,
                    styles,
                    siteScripts,
                    siteBodyScripts,
                    siteStyles
                } = props;
                const result: PageFiles = {
                    html: {
                        title: thisPage.title,
                        url: thisPage.route,
                        fileBody: '',
                        filePath: `${getDenormalizedRoute(thisPage.route)}.html`
                    },
                    styles: {
                        fileBody: '',
                        filePath: `${BUCKET_GENERATED_DIR}/${thisPage.id}/styles.css`
                    }
                };
                thisPage.article = await LiquidEngine.parseAndRender(marked.parse(markdown, {async: false}) as string, {
                    site,
                    thisPage
                });
                result.styles.fileBody = styles
                    ? await LiquidEngine.parseAndRender(styles, {
                        site,
                        thisPage
                    })
                    : '';
                const stylesUrl = `/${result.styles.filePath}`;
                result.html.fileBody = await LiquidEngine.parseAndRender(html, {
                    site,
                    thisPage,
                    styles: siteStyles
                        ? `<link rel="stylesheet" href="${siteStyles}"/>\n<link rel="stylesheet" href="${stylesUrl}"/>`
                        : `<link rel="stylesheet" href="${stylesUrl}"/>`,
                    headScripts: siteScripts,
                    bodyScripts: siteBodyScripts,
                });
                this.pageFilesGeneratorPromise = undefined;
                return result;
            })().catch((e: any) => {
                this.pageFilesGeneratorPromise = undefined;
                throw e;
            });
        }
        return this.pageFilesGeneratorPromise;
    }

    public async generateSiteFiles(site: SiteContext, siteScripts: string, siteBodyScripts: string, siteStyles: string): Promise<SiteFiles> {
        if (!this.siteFilesGeneratorPromise) {
            this.siteFilesGeneratorPromise = (async () => {
                const filePath = `${BUCKET_GENERATED_DIR}/global/styles.css`;
                const result: SiteFiles = {
                    siteScripts: undefined,
                    siteBodyScripts: undefined,
                    styles: {
                        url: `/${filePath}`,
                        fileBody: '',
                        filePath
                    },
                    sitemap: {
                        fileBody: sitemapTemplate(site),
                        filePath: 'sitemap.xml'
                    }
                };
                result.styles.fileBody = siteStyles
                    ? await LiquidEngine.parseAndRender(siteStyles, {
                        site
                    })
                    : '';
                result.siteScripts = siteScripts
                    ? await LiquidEngine.parseAndRender(siteScripts, {
                        site
                    })
                    : undefined;
                result.siteBodyScripts = siteBodyScripts
                    ? await LiquidEngine.parseAndRender(siteBodyScripts, {
                        site
                    })
                    : undefined;

                this.siteFilesGeneratorPromise = undefined;
                return result;
            })().catch((e: any) => {
                this.siteFilesGeneratorPromise = undefined;
                throw e;
            });
        }
        return this.siteFilesGeneratorPromise;
    }
}

export const localHtmlGeneratorSingleton = new LocalHtmlGenerator();
