import cloneDeep from 'lodash/cloneDeep';
import {QueryCommandInput} from '@aws-sdk/client-dynamodb';
import {
    PLATFORM_DOCUMENTS_TABLE_NAME,
    PLATFORM_ENTRIES_BY_TYPE_INDEX_NAME,
    DI_PAGE_ENTRY_SLICE_KEYS,
    DI_ENTRY_SLICE_KEY,
    DI_TAG_SLICE_KEY,
    DI_TAG_ENTRY_SLICE_KEYS,
    DI_DESCRIPTION_SLICE_KEY,
    DI_GENERATOR_STATUS_SLICE_KEY,
    DI_SITE_ENTRY_KEY,
    DI_GENERATOR_ENTRY_KEY,
    DI_TAG_ENTRY_PREFIX,
    DI_PAGE_CONTENT_SLICE_KEY,
    DI_PAGE_META_SLICE_KEY,
    DI_TEMPLATE_ENTRY_SLICE_KEYS,
    DI_TEMPLATE_CONTENT_SLICE_KEY,
    DI_TEMPLATE_META_SLICE_KEY,
    DI_PAGE_ENTRY_PREFIX,
    DI_SITE_ENTRY_TYPE,
    DI_DELETED_PAGE_ENTRY_TYPE,
    PLATFORM_ENTRIES_BY_TEMPLATE_ID_INDEX_NAME,
    DI_TEMPLATE_ENTRY_PREFIX,
    DI_SITE_MAP_SLICE_KEY,
    DI_SITE_CONTENT_SLICE_KEY,
    DI_PAGE_ARTICLE_SLICE_KEY,
    DI_PAGE_ENTRY_TYPE,
    PLATFORM_SYSTEM_BUCKET_NAME,
    BUCKET_DOCUMENTS_DIR, DI_SITE_PARTIAL_SLICE_KEY
} from '../constants';
import {
    DI_EntrySlice,
    DI_PageEntry,
    DI_PageContentSlice,
    DI_PageMetaSlice,
    DI_TagSlice,
    DI_TagEntry,
    DI_DescriptionSlice,
    DI_SiteEntry,
    DI_SiteMapSlice,
    DI_Generator,
    DI_GeneratorStatusSlice,
    DI_TemplateEntry,
    DI_TemplateContentSlice,
    DI_TemplateMetaSlice, DI_SiteContentSlice, DI_PageArticleSlice, DI_SitePartialContentSlice
} from '../data/DocumentItem';
import {BasicItem} from '../data/BasicItem';
import {queryWithExponentialBackoff, createOrUpdateItem, deleteItemByKey} from '../aws/database';
import {defaultGeneratorStatusSlice} from '../utility/defaultGeneratorStatusSlice';
import {defaultSiteContentSlice} from '../utility/defaultSiteContentSlice';
import {writeFileContentAsString} from '../aws/bucket';

export async function getEntrySliceByEntryType(entryTypeValue: {S: string}): Promise<Array<DI_EntrySlice>> {
    const params: QueryCommandInput = {
        TableName: PLATFORM_DOCUMENTS_TABLE_NAME,
        IndexName: PLATFORM_ENTRIES_BY_TYPE_INDEX_NAME,
        KeyConditionExpression: "#entryTypeField = :entryTypeValue",
        ExpressionAttributeNames: {
            "#entryTypeField": "EntryType",
        },
        ExpressionAttributeValues: {
            ":entryTypeValue": entryTypeValue,
        },
    };
    return await queryWithExponentialBackoff(params) as Array<DI_EntrySlice>;
}

export async function getEntryIdsByPageTemplateId(pageTemplateId: string): Promise<Array<{S: string}>> {
    const params: QueryCommandInput = {
        TableName: PLATFORM_DOCUMENTS_TABLE_NAME,
        IndexName: PLATFORM_ENTRIES_BY_TEMPLATE_ID_INDEX_NAME,
        KeyConditionExpression: "#pageTemplateIdField = :pageTemplateIdValue",
        ExpressionAttributeNames: {
            "#pageTemplateIdField": "PageTemplateId",
        },
        ExpressionAttributeValues: {
            ":pageTemplateIdValue": {S: pageTemplateId},
        },
    };
    return (await queryWithExponentialBackoff(params) as Array<{PageTemplateId: {S: string}, PK: {S: string}}>)
        .map((item) => item.PK);
}

export async function deletePageEntry(id: string): Promise<void> {
    const PK = {S: `${DI_PAGE_ENTRY_PREFIX}#${id}`};
    const foundPageEntries = await getPageEntriesByKeys([PK], ['ENTRY']);
    if (foundPageEntries.length > 0 && foundPageEntries[0].Entry) {
        foundPageEntries[0].Entry.EntryType.S = DI_DELETED_PAGE_ENTRY_TYPE;
        await createOrUpdateItem(PLATFORM_DOCUMENTS_TABLE_NAME, foundPageEntries[0].Entry);
    } else {
        throw Error('The page entry requested to delete was not found');
    }
}

export async function erasePageEntry(id: string): Promise<void> {
    const PK = {S: `${DI_PAGE_ENTRY_PREFIX}#${id}`};
    for (const slice of DI_PAGE_ENTRY_SLICE_KEYS) {
        await deleteItemByKey(PLATFORM_DOCUMENTS_TABLE_NAME, {
            PK,
            SK: {S: slice}
        });
    }
}

export async function copyTemplateEntry(id: string, newId: string, newTitle: string): Promise<void> {
    const foundTemplateEntries = await getTemplateEntriesByKeys([{S: `${DI_TEMPLATE_ENTRY_PREFIX}#${id}`}]);
    if (foundTemplateEntries.length > 0) {
        const {Entry, Meta, Content} = foundTemplateEntries[0];
        if (Entry && Content && Meta) {
            const newPK = {S: `${DI_TEMPLATE_ENTRY_PREFIX}#${newId}`};
            Entry.PK = newPK;
            Entry.EntryCreateDate.N = Date.now().toString();
            Entry.EntryUpdateDate.N = Date.now().toString();
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Entry);
            Content.PK = newPK;
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Content);
            Meta.PK = newPK;
            Meta.TemplateTitle.S = newTitle;
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Meta);
        }
    } else {
        throw Error('The template entry for copying was not found');
    }
}

export async function copyPageEntry(id: string, newId: string, route?: string, newTemplateId?: string): Promise<void> {
    const foundPageEntries = await getPageEntriesByKeys([{S: `${DI_PAGE_ENTRY_PREFIX}#${id}`}]);
    if (foundPageEntries.length > 0) {
        const {Entry, Content, Meta, Article} = foundPageEntries[0];
        if (Entry && Content && Meta && Article) {
            const newPK = {S: `${DI_PAGE_ENTRY_PREFIX}#${newId}`};
            Entry.PK = newPK;
            Entry.EntryType.S = DI_PAGE_ENTRY_TYPE;
            Entry.EntryCreateDate.N = Date.now().toString();
            Entry.EntryUpdateDate.N = Date.now().toString();
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Entry);
            Content.PK = newPK;
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Content);
            Meta.PK = newPK;
            Meta.PageTitle.S = `${Meta.PageTitle.S} ${newId}`;
            Meta.PageSlug.S = `${Meta.PageSlug.S}-${newId}`;
            if (route) {
                Meta.PageRoute.S = route;
            }
            if (newTemplateId) {
                Meta.PageTemplateId.S = newTemplateId;
            }
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Meta);
            Article.PK = newPK;
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Article);
        } else {
            throw Error('The page entry misses the data for copying.');
        }
    } else {
        throw Error('The page entry for copying was not found');
    }
}

export async function getPageEntriesByKeys(
    keys: Array<{S: string}>,
    slices?: Array<typeof DI_PAGE_ENTRY_SLICE_KEYS[number]>
): Promise<Array<DI_PageEntry>> {
    const result: Array<DI_PageEntry> = [];
    const tagEntriesCache: Record<string, DI_TagEntry> = {};
    const requiredSlices = slices || DI_PAGE_ENTRY_SLICE_KEYS;
    for (const key of keys) {
        const resultItem: DI_PageEntry = {};
        if (requiredSlices.length > 0) {
            for (const slice of requiredSlices) {
                const params: QueryCommandInput = {
                    TableName: PLATFORM_DOCUMENTS_TABLE_NAME,
                    KeyConditionExpression: slice === DI_TAG_ENTRY_PREFIX
                        ? 'PK = :keyValue AND begins_with(SK, :sliceValue)'
                        : 'PK = :keyValue AND SK = :sliceValue',
                    ExpressionAttributeValues: {
                        ':keyValue': key,
                        ':sliceValue': {S: slice}
                    }
                };
                const sliceRecords: Array<BasicItem> = await queryWithExponentialBackoff(params);
                if (sliceRecords && sliceRecords.length > 0) {
                    for (const sliceRecord of sliceRecords) {
                        if (sliceRecord.SK.S === DI_PAGE_CONTENT_SLICE_KEY) {
                            resultItem.Content = cloneDeep(sliceRecord as DI_PageContentSlice);
                        } else if (sliceRecord.SK.S === DI_PAGE_ARTICLE_SLICE_KEY) {
                            resultItem.Article = cloneDeep(sliceRecord as DI_PageArticleSlice);
                        } else if (sliceRecord.SK.S === DI_ENTRY_SLICE_KEY) {
                            resultItem.Entry = cloneDeep(sliceRecord as DI_EntrySlice);
                        } else if (sliceRecord.SK.S === DI_PAGE_META_SLICE_KEY) {
                            resultItem.Meta = cloneDeep(sliceRecord as DI_PageMetaSlice);
                        } else if (sliceRecord.SK.S.startsWith(DI_TAG_SLICE_KEY)) {
                            resultItem.Tags = resultItem.Tags || [];
                            resultItem.Tags.push(cloneDeep(sliceRecord) as DI_TagSlice);
                        }
                    }
                }
                if (resultItem.Tags && resultItem.Tags.length > 0) {
                    let foundEntries: Array<DI_TagEntry> = [];
                    const keys: Array<{S: string}> = [];
                    for (const tag of resultItem.Tags) {
                        const foundInCacheEntry: DI_TagEntry | undefined = tagEntriesCache[tag.SK.S];
                        if (foundInCacheEntry) {
                            foundEntries.push(foundInCacheEntry);
                        } else {
                            keys.push(tag.SK);
                        }
                    }
                    foundEntries = foundEntries.concat(
                        await getTagEntriesByKeys(keys)
                    );
                    for (const foundEntry of foundEntries) {
                        tagEntriesCache[foundEntry.Entry.PK.S] = foundEntry;
                    }
                    resultItem.TagEntries = foundEntries;
                }
            }
        }
        if (Object.keys(resultItem).length > 0) {
            result.push(resultItem);
        }
    }
    return result;
}

export async function getTagEntriesByKeys(keys: Array<{S: string}>): Promise<Array<DI_TagEntry>> {
    const result: Array<DI_TagEntry> = [];
    const slices = DI_TAG_ENTRY_SLICE_KEYS;
    for (const key of keys) {
        if (slices && slices.length > 0) {
            let description: DI_DescriptionSlice | undefined = undefined;
            let entry: DI_EntrySlice | undefined = undefined;
            for (const slice of slices) {
                const params: QueryCommandInput = {
                    TableName: PLATFORM_DOCUMENTS_TABLE_NAME,
                    KeyConditionExpression: 'PK = :keyValue AND SK = :sliceValue',
                    ExpressionAttributeValues: {
                        ':keyValue': key,
                        ':sliceValue': {S: slice}
                    }
                };
                const sliceRecords: Array<BasicItem> = await queryWithExponentialBackoff(params);
                if (sliceRecords && sliceRecords.length > 0) {
                    for (const sliceRecord of sliceRecords) {
                        if (sliceRecord.SK.S === DI_DESCRIPTION_SLICE_KEY) {
                            description = cloneDeep(sliceRecord as DI_DescriptionSlice);
                        } else if (sliceRecord.SK.S === DI_ENTRY_SLICE_KEY) {
                            entry = cloneDeep(sliceRecord as DI_EntrySlice);
                        }
                    }
                }
            }
            if (description && entry) {
                result.push({
                    Description: description,
                    Entry: entry
                });
            }
        }
    }
    return result;
}

export async function getTemplateEntriesByKeys(
    keys: Array<{S: string}>,
    slices?: Array<typeof DI_TEMPLATE_ENTRY_SLICE_KEYS[number]>
): Promise<Array<DI_TemplateEntry>> {
    const result: Array<DI_TemplateEntry> = [];
    const requiredSlices = slices || DI_TEMPLATE_ENTRY_SLICE_KEYS;
    for (const key of keys) {
        if (requiredSlices && requiredSlices.length > 0) {
            let resultItem: DI_TemplateEntry = {};
            for (const slice of requiredSlices) {
                const params: QueryCommandInput = {
                    TableName: PLATFORM_DOCUMENTS_TABLE_NAME,
                    KeyConditionExpression: 'PK = :keyValue AND SK = :sliceValue',
                    ExpressionAttributeValues: {
                        ':keyValue': key,
                        ':sliceValue': {S: slice}
                    }
                };
                const sliceRecords: Array<BasicItem> = await queryWithExponentialBackoff(params);
                if (sliceRecords && sliceRecords.length > 0) {
                    for (const sliceRecord of sliceRecords) {
                        if (sliceRecord.SK.S === DI_TEMPLATE_CONTENT_SLICE_KEY) {
                            resultItem.Content = cloneDeep(sliceRecord as DI_TemplateContentSlice);
                        } else if (sliceRecord.SK.S === DI_TEMPLATE_META_SLICE_KEY) {
                            resultItem.Meta = cloneDeep(sliceRecord as DI_TemplateMetaSlice);
                        } else if (sliceRecord.SK.S === DI_ENTRY_SLICE_KEY) {
                            resultItem.Entry = cloneDeep(sliceRecord as DI_EntrySlice);
                        }
                    }
                } else {
                    break;
                }
            }
            if (Object.keys(resultItem).length > 0) {
                result.push(resultItem);
            }
        }
    }
    return result;
}

export async function getSiteEntry(): Promise<DI_SiteEntry> {
    const result: DI_SiteEntry = {
        SitePartials: []
    };
    const params: QueryCommandInput = {
        TableName: PLATFORM_DOCUMENTS_TABLE_NAME,
        KeyConditionExpression: 'PK = :keyValue',
        ExpressionAttributeValues: {
            ':keyValue': {S: DI_SITE_ENTRY_KEY}
        }
    };
    const sliceRecords: Array<BasicItem> = await queryWithExponentialBackoff(params);
    if (sliceRecords && sliceRecords.length > 0) {
        for (const sliceRecord of sliceRecords) {
            if (sliceRecord.SK.S === DI_SITE_MAP_SLICE_KEY) {
                result.SiteMap = cloneDeep(sliceRecord as DI_SiteMapSlice);
            } else if (sliceRecord.SK.S === DI_SITE_CONTENT_SLICE_KEY) {
                result.SiteContent = cloneDeep(sliceRecord as DI_SiteContentSlice);
            } else if (sliceRecord.SK.S === DI_ENTRY_SLICE_KEY) {
                result.Entry = cloneDeep(sliceRecord as DI_EntrySlice);
            } else if (sliceRecord.SK.S.startsWith(DI_SITE_PARTIAL_SLICE_KEY)) {
                result.SitePartials = result.SitePartials || [];
                result.SitePartials.push(cloneDeep(sliceRecord as DI_SitePartialContentSlice));
            }
        }
    }
    return result;
}

export async function createSiteEntry(): Promise<DI_SiteEntry> {
    const result: DI_SiteEntry = {
        Entry: {
            PK: {S: DI_SITE_ENTRY_KEY},
            SK: {S: DI_ENTRY_SLICE_KEY},
            EntryType: {S: DI_SITE_ENTRY_TYPE},
            EntryCreateDate: {N: Date.now().toString()},
            EntryUpdateDate: {N: Date.now().toString()}
        },
        SiteMap: {
            PK: {S: DI_SITE_ENTRY_KEY},
            SK: {S: DI_SITE_MAP_SLICE_KEY},
            MainPageId: {S: ''},
            Error404PageId: {S: ''}
        },
        SiteContent: cloneDeep(defaultSiteContentSlice),
        SitePartials: []
    };
    await createOrUpdateItem<DI_EntrySlice>(PLATFORM_DOCUMENTS_TABLE_NAME, result.Entry as DI_EntrySlice);
    await createOrUpdateItem<DI_SiteMapSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, result.SiteMap as DI_SiteMapSlice);
    await createOrUpdateItem<DI_SiteContentSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, result.SiteContent as DI_SiteContentSlice);
    await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteScripts.html`, '', 'text/html');
    await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteBodyScripts.html`, '', 'text/html');
    await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteStyles.css`, '/* No Styles */', 'text/css');
    return result;
}

export async function getGenerator(): Promise<DI_Generator> {
    const result: DI_Generator = {};
    const params: QueryCommandInput = {
        TableName: PLATFORM_DOCUMENTS_TABLE_NAME,
        KeyConditionExpression: 'PK = :keyValue',
        ExpressionAttributeValues: {
            ':keyValue': {S: DI_GENERATOR_ENTRY_KEY}
        }
    };
    const sliceRecords: Array<BasicItem> = await queryWithExponentialBackoff(params);
    if (sliceRecords && sliceRecords.length > 0) {
        for (const sliceRecord of sliceRecords) {
            if (sliceRecord.SK.S === DI_GENERATOR_STATUS_SLICE_KEY) {
                result.Status = cloneDeep(sliceRecord as DI_GeneratorStatusSlice);
            }
        }
    }
    return result;
}

export async function createGenerator(): Promise<DI_Generator> {
    const result: DI_Generator = {};
    result.Status = cloneDeep(defaultGeneratorStatusSlice);
    await createOrUpdateItem<DI_GeneratorStatusSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, result.Status);
    return result;
}

export async function updateGeneratorLastChange(value: string): Promise<DI_GeneratorStatusSlice> {
    return createOrUpdateItem<DI_GeneratorStatusSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, {
        ...defaultGeneratorStatusSlice,
        LastChanged: {N: value}
    }, ['LastChanged']);
}
