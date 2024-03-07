import {
    DI_SITE_ENTRY_KEY,
    DI_SITE_CONTENT_SLICE_KEY
} from '../constants';
import {DI_SiteContentSlice} from '../data/DocumentItem';

const dataConfig = `{}
`;

const data = `[]
`

export const defaultSiteContentSlice: DI_SiteContentSlice = {
    PK: {S: DI_SITE_ENTRY_KEY},
    SK: {S: DI_SITE_CONTENT_SLICE_KEY},
    SiteContentData: {S: data},
    SiteContentDataConfig: {S: dataConfig}
};
