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
    partials: Record<string, string>;
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
    thisPage: PageContext;
    site: SiteContext;
}

export type SiteFiles = {
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
                    siteStyles
                } = props;
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
                const partials: Record<string, string> = {};
                for (const sitePartial of Object.entries(site.partials)) {
                    partials[sitePartial[0]] = await LiquidEngine.parseAndRender(sitePartial[1], {
                        isDevMode: 'true',
                        site
                    });
                }
                const stylesTag = renderedSiteStyles
                    ? `<style>${renderedSiteStyles}</style>\n<style>${renderedPageStyles}</style>`
                    : `<style>${renderedPageStyles}</style>`;
                const fixedHtml = html.replace('<head>', `<head><base href="https://${site.domain}/" /><base target="_blank" />`)
                thisPage.article = await LiquidEngine.parseAndRender(marked.parse(markdown, {async: false}) as string, {
                    isDevMode: 'true',
                    site,
                    thisPage,
                    partials
                });
                const rendered = await LiquidEngine.parseAndRender(fixedHtml, {
                    isDevMode: 'true',
                    thisPage,
                    site,
                    styles: stylesTag,
                    partials,
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
                    siteStyles
                } = props;
                const result: PageFiles = {
                    html: {
                        title: thisPage.title,
                        url: thisPage.route,
                        fileBody: '',
                        filePath: `${getDenormalizedRoute(thisPage.route) || 'index'}.html`
                    },
                    styles: {
                        fileBody: '',
                        filePath: `${BUCKET_GENERATED_DIR}/${thisPage.id}/styles.css`
                    }
                };
                const partials: Record<string, string> = {};
                for (const sitePartial of Object.entries(site.partials)) {
                    partials[sitePartial[0]] = await LiquidEngine.parseAndRender(sitePartial[1], {
                        isDevMode: 'true',
                        site
                    });
                }
                result.styles.fileBody = styles
                    ? await LiquidEngine.parseAndRender(styles, {
                        site,
                        thisPage
                    })
                    : '';
                thisPage.article = await LiquidEngine.parseAndRender(marked.parse(markdown, {async: false}) as string, {
                    site,
                    thisPage,
                    partials
                });
                const stylesUrl = `/${result.styles.filePath}`;
                result.html.fileBody = await LiquidEngine.parseAndRender(html, {
                    site,
                    thisPage,
                    partials,
                    styles: siteStyles
                        ? `<link rel="stylesheet" href="${siteStyles}"/>\n<link rel="stylesheet" href="${stylesUrl}"/>`
                        : `<link rel="stylesheet" href="${stylesUrl}"/>`,
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

    public async generateSiteFiles(site: SiteContext, siteStyles: string): Promise<SiteFiles> {
        if (!this.siteFilesGeneratorPromise) {
            this.siteFilesGeneratorPromise = (async () => {
                const filePath = `${BUCKET_GENERATED_DIR}/global/styles.css`;
                const result: SiteFiles = {
                    styles: {
                        url: `/${filePath}`,
                        fileBody: siteStyles
                            ? await LiquidEngine.parseAndRender(siteStyles, {
                                site
                            })
                            : '',
                        filePath
                    },
                    sitemap: {
                        fileBody: sitemapTemplate(site),
                        filePath: 'sitemap.xml'
                    }
                };
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
