import {ItemKey} from './BasicItem';

// |--------|---------|-----------|
// | PK     | SK      | EntryType |
// |--------|---------|-----------|
// | PAGE#1 | ENTRY#1 | page      |
// |--------|---------|-----------|
// | TAG#1  | ENTRY#1 | tag       |
// |--------|---------|-----------|

// Tag -> PK: TAG#[TAG_ID], SK: ENTRY
// Page -> PK: PAGE#[PAGE_ID], SK: ENTRY
// Site -> PK: SITE, SK: ENTRY
// Template -> PK: TEMPLATE#[TEMPLATE_ID], SK: ENTRY
export type DI_EntrySlice = ItemKey & {
    EntryType: { S: string }; // template, page, tag, site | Index: PLATFORM_ENTRIES_BY_TYPE_INDEX_NAME
    EntryCreateDate: { N: string }; // when the entry was created
    EntryUpdateDate: { N: string }; // when the entry was updated
};

// Generator -> PK: GENERATOR, SK: STATUS
export type DI_GeneratorStatusSlice = ItemKey & {
    LastRun: {N: string}; // the last timestamp the generator started
    State: {S: string}; // running | idle | with_errors
    LastChanged: {N: string}; // the last time any important change was made in pages
    Error: {S: string};
};

// Page -> PK: PAGE#[PAGE_ID], SK: TAG#[TAG_ID]
export type DI_TagSlice = ItemKey & {
    TagId: { S: string }; // Index: PLATFORM_ENTRIES_BY_TAG_ID_INDEX_NAME
};

// Page -> PK: PAGE#[PAGE_ID], SK: PAGE_META
export type DI_PageMetaSlice = ItemKey & {
    PageTitle: { S: string }; // any arbitrary text used as a title in an HTML page
    PageRoute: { S: string }; // route path, used for grouping pages...
    PageSlug: { S: string }; // slug of the page route: /{slug}
    PageTemplateId: {S: string}; // TEMPLATE_ID
    ExcludeFromSitemap?: {S: string}; // do not include in sitemap.xml -> true | false
};

// Template -> PK: TEMPLATE#[TEMPLATE_ID], SK: TEMPLATE_META
export type DI_TemplateMetaSlice = ItemKey & {
    TemplateTitle: {S: string}; // title for the template
};

// Page -> PK: PAGE#[PAGE_ID], SK: PAGE_CONTENT
export type DI_PageContentSlice = ItemKey & {
    PageContentData: { S: string };
};

// Page -> PK: PAGE#[PAGE_ID], SK: PAGE_ARTICLE
export type DI_PageArticleSlice = ItemKey & {
    PageArticleData: { S: string };
};

// Template -> PK: TEMPLATE#[TEMPLATE_ID], SK: TEMPLATE_CONTENT
export type DI_TemplateContentSlice = ItemKey & {
    PageContentDataConfig: { S: string }; // config for the page data individually
    TemplateContentData: { S: string }; // shared data between all pages with this template
    TemplateContentDataConfig: { S: string; }; // configuration for shared data
}

// Tag -> PK: TAG#[TAG_ID], SK: DESCRIPTION
export type DI_DescriptionSlice = ItemKey & {
    DescriptionLabel: { S: string };
    DescriptionText: { S: string };
};

// Site -> PK: SITE, SK: SITE_MAP
export type DI_SiteMapSlice = ItemKey & {
    MainPageId: { S: string };
    Error404PageId: { S: string };
};

// Site -> PK: SITE, SK: SITE_CONTENT
export type DI_SiteContentSlice = ItemKey & {
    SiteContentData: {S: string};
    SiteContentDataConfig: {S: string};
};

// Site -> PK: SITE, SK: SITE_PARTIAL#[PARTIAL_KEY]
export type DI_SitePartialContentSlice = ItemKey & {
    SitePartialLabel: {S: string};
    SitePartialKey: {S: string};
    SitePartialContentData: {S: string};
};

// Entries - composites of the slices

export type DI_TagEntry = {
    Entry: DI_EntrySlice; // PK: TAG#[TAG_ID], SK: ENTRY
    Description: DI_DescriptionSlice; // PK: TAG#[TAG_ID], SK: DESCRIPTION
};

export type DI_PageEntry = {
    Entry?: DI_EntrySlice; // PK: PAGE#[PAGE_ID], SK: ENTRY
    Meta?: DI_PageMetaSlice; // PK: PAGE#[PAGE_ID], SK: PAGE_META
    Content?: DI_PageContentSlice; // PK: PAGE#[PAGE_ID], SK: PAGE_CONTENT
    Article?: DI_PageArticleSlice; // PK: PAGE#[PAGE_ID], SK: PAGE_ARTICLE
    Tags?: Array<DI_TagSlice>; // PK: PAGE#[PAGE_ID], SK: TAG#[TAG_ID]
    TagEntries?: Array<DI_TagEntry>;
};

export type DI_TemplateEntry = {
    Entry?: DI_EntrySlice; // PK: TEMPLATE#[TEMPLATE_ID], SK: ENTRY
    Meta?: DI_TemplateMetaSlice; // PK: TEMPLATE#[TEMPLATE_ID], SK: TEMPLATE_META
    Content?: DI_TemplateContentSlice; // PK: TEMPLATE#[TEMPLATE_ID], SK: TEMPLATE_CONTENT
    Html?: string; // html
    Styles?: string; // CSS styles
};

export type DI_SiteEntry = {
    Entry?: DI_EntrySlice;
    SiteMap?: DI_SiteMapSlice;
    SiteContent?: DI_SiteContentSlice;
    SiteStyles?: string; // CSS global
    SitePartials: Array<DI_SitePartialContentSlice>;
};

export type DI_Generator = {
    Status?: DI_GeneratorStatusSlice;
};
