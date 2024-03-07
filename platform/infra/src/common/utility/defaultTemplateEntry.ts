import {DI_PageEntry, DI_TemplateEntry} from '../data/DocumentItem';
import {
    DI_ENTRY_SLICE_KEY,
    DI_TEMPLATE_ENTRY_PREFIX,
    DI_TEMPLATE_ENTRY_TYPE,
    DI_TEMPLATE_META_SLICE_KEY,
    DI_TEMPLATE_CONTENT_SLICE_KEY,
    DI_PAGE_ENTRY_PREFIX,
    DI_PAGE_ENTRY_TYPE,
    DI_PAGE_META_SLICE_KEY,
    DI_PAGE_CONTENT_SLICE_KEY,
    DI_PAGE_ROUTE_ROOT,
    DI_PAGE_ARTICLE_SLICE_KEY
} from '../constants';

const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    {{headScripts}}
    {{styles}}
  </head>
  <body>
    {{bodyScripts}}
  </body>
</html>
`;

const styles = `/* No Styles */
`;

const dataConfig = `{}
`;

const data = `[]
`
export const defaultTemplateId = 'index_page';
export const pageEntryId = 'index';

export const defaultPageEntry: DI_PageEntry = {
    Entry: {
        PK: {S: `${DI_PAGE_ENTRY_PREFIX}#${pageEntryId}`},
        SK: {S: DI_ENTRY_SLICE_KEY},
        EntryType: {S: DI_PAGE_ENTRY_TYPE},
        EntryCreateDate: {N: Date.now().toString()},
        EntryUpdateDate: {N: Date.now().toString()}
    },
    Meta: {
        PK: {S: `${DI_PAGE_ENTRY_PREFIX}#${pageEntryId}`},
        SK: {S: DI_PAGE_META_SLICE_KEY},
        PageTitle: {S: 'Home'},
        PageRoute: {S: DI_PAGE_ROUTE_ROOT},
        PageSlug: {S: 'index'},
        PageTemplateId: {S: defaultTemplateId}
    },
    Content: {
        PK: {S: `${DI_PAGE_ENTRY_PREFIX}#${pageEntryId}`},
        SK: {S: DI_PAGE_CONTENT_SLICE_KEY},
        PageContentData: {S: data},
    },
    Article: {
        PK: {S: `${DI_PAGE_ENTRY_PREFIX}#${pageEntryId}`},
        SK: {S: DI_PAGE_ARTICLE_SLICE_KEY},
        PageArticleData: {S: ''}
    }
};

export const defaultTemplateEntry: DI_TemplateEntry = {
    Entry: {
        PK: {S: `${DI_TEMPLATE_ENTRY_PREFIX}#${defaultTemplateId}`},
        SK: {S: DI_ENTRY_SLICE_KEY},
        EntryType: {S: DI_TEMPLATE_ENTRY_TYPE},
        EntryCreateDate: {N: Date.now().toString()},
        EntryUpdateDate: {N: Date.now().toString()}
    },
    Meta: {
        PK: {S: `${DI_TEMPLATE_ENTRY_PREFIX}#${defaultTemplateId}`},
        SK: {S: DI_TEMPLATE_META_SLICE_KEY},
        TemplateTitle: {S: 'Home Page'},
    },
    Content: {
        PK: {S: `${DI_TEMPLATE_ENTRY_PREFIX}#${defaultTemplateId}`},
        SK: {S: DI_TEMPLATE_CONTENT_SLICE_KEY},
        PageContentDataConfig: {S: dataConfig},
        TemplateContentDataConfig: {S: '{}'},
        TemplateContentData: {S: '{}'}
    },
    Html: html,
    Styles: styles,
};
