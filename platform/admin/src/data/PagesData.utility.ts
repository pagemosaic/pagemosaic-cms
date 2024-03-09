import groupBy from 'lodash-es/groupBy';
import {DI_TemplateEntry, DI_PageEntry} from 'infra-common/data/DocumentItem';
import {getIdFromPK} from 'infra-common/utility/database';
import {DI_PAGE_ROUTE_ROOT} from 'infra-common/constants';

export type PageRow = {
    pageId: string;
    templateId: string;
    pageTitle: string;
    isMainPage: boolean;
    pageSlug: string;
    lastSaved: string;
    created: number;
    updated: number;
    pageRoute: string;
};

export type TemplateRow = {
    templateId: string;
    templateTitle: string;
    pages: Array<PageRow>;
};

export type PagesNode = {
    isRoot?: boolean;
    path: string;
    dirName: string;
    templates: Array<TemplateRow>;
    children: Array<PagesNode>;
    parent?: PagesNode;
};

export function listToTree(pagesEntries: Array<DI_PageEntry>, templateEntries: Array<DI_TemplateEntry>): Array<PagesNode> {
    const root: Array<PagesNode> = [];
    if (pagesEntries && templateEntries) {
        const pagesTemplatesMap: Record<string, Array<DI_TemplateEntry>> = groupBy(templateEntries, function (templateEntry) {
            return getIdFromPK(templateEntry.Entry?.PK.S);
        });
        for (const pageEntry of pagesEntries) {
            const {Entry, Meta} = pageEntry;
            if (Entry && Meta) {
                // check if the page has template ref
                const pageTemplates: Array<DI_TemplateEntry> | undefined = pagesTemplatesMap[Meta.PageTemplateId.S];
                if (!pageTemplates || pageTemplates.length === 0) {
                    throw Error(`The ${Meta.PageTitle.S} page entry missing template reference.`);
                }
                let currentLevel = root;
                const parts = Meta.PageRoute.S
                    ? Meta.PageRoute.S.split('/')
                    : [DI_PAGE_ROUTE_ROOT];
                let part: string;
                for (let i = 0; i < parts.length; i++) {
                    part = parts[i];
                    if (part && part.length > 0) {
                        const isLastPart = i === parts.length - 1;
                        let node = currentLevel.find(node => node.dirName === part);
                        if (!node) {
                            node = {
                                dirName: part,
                                path: parts.slice(0, i + 1).join('/'),
                                children: [],
                                templates: []
                            };
                            currentLevel.push(node);
                        }
                        if(isLastPart) { // add templates and pages only if this is the last part of the route path
                            let foundNodeTemplate: TemplateRow | undefined = undefined;
                            if (node.templates.length > 0) {
                                foundNodeTemplate = node.templates.find(template => template.templateId === Meta.PageTemplateId.S);
                            }
                            if (!foundNodeTemplate) {
                                foundNodeTemplate = {
                                    pages: [],
                                    templateId: Meta.PageTemplateId.S,
                                    templateTitle: pageTemplates[0].Meta?.TemplateTitle.S || ''
                                };
                                node.templates.push(foundNodeTemplate);
                            }
                            if (foundNodeTemplate) {
                                foundNodeTemplate.pages.push({
                                    pageId: getIdFromPK(Entry.PK.S),
                                    pageRoute: Meta.PageRoute.S,
                                    pageSlug: Meta.PageSlug.S,
                                    pageTitle: Meta.PageTitle.S,
                                    lastSaved: Entry.EntryUpdateDate.N,
                                    updated: Number(Entry.EntryUpdateDate.N || 0),
                                    created: Number(Entry.EntryCreateDate.N || 0),
                                    templateId: foundNodeTemplate.templateId,
                                    isMainPage: Meta.PageSlug.S === 'index' && Meta.PageRoute.S === DI_PAGE_ROUTE_ROOT
                                });
                            }
                        }
                        currentLevel = node.children;
                    }
                }
            }
        }
    }
    return root;
}

export function setParentReferences(node: PagesNode, parent?: PagesNode): void {
    node.parent = parent;
    for (let child of node.children) {
        setParentReferences(child, node);
    }
}

export function getParentNodes(node: PagesNode): Array<PagesNode> {
    const parents: Array<PagesNode> = [];
    while (node.parent) {
        parents.unshift(node.parent);
        node = node.parent;
    }
    return parents;
}

export function findNodeByPath(root: PagesNode, path: string): PagesNode | undefined {
    if (root.path === path) {
        return root;
    }
    for (const child of root.children) {
        const foundNode = findNodeByPath(child, path);
        if (foundNode) {
            return foundNode;
        }
    }
    return undefined;
}

export function findTemplatesByFilter(root: PagesNode, filter: string): Array<TemplateRow> {
    const validFilter = filter.toLowerCase();
    let foundTemplates: Array<TemplateRow> = [];
    if (root.templates.length > 0) {
        let foundPagesInTemplate: Array<PageRow>;
        for (const template of root.templates) {
            foundPagesInTemplate = template.pages.filter(p => p.pageTitle.toLowerCase().includes(validFilter));
            if (foundPagesInTemplate.length > 0) {
                foundTemplates.push({
                    templateId: template.templateId,
                    templateTitle: template.templateTitle,
                    pages: foundPagesInTemplate
                });
            }
        }
    }
    for (const child of root.children) {
        foundTemplates = foundTemplates.concat(findTemplatesByFilter(child, filter));
    }
    return foundTemplates;
}
