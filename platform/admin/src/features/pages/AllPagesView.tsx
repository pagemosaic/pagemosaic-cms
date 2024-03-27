import React, {useMemo, useEffect, useState, useRef} from 'react';
import {formatDistanceToNow} from 'date-fns';
import {useNavigate} from 'react-router-dom';
import {
    LucideHome,
    LucideLink,
    LucideFile,
    LucideFolder,
    LucideChevronRight,
    LucideFolderMinus,
    LucideXCircle
} from 'lucide-react';
import debounce from 'lodash-es/debounce';
import {Allotment} from 'allotment';
import {PagesData} from '@/data/PagesData';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Table, TableBody, TableRow, TableCell} from '@/components/ui/table';
import {Card} from '@/components/ui/card';
import {PageDropdownMenu, CopyPageButton} from '@/features/pages/PageDropdownMenu';
import {PageDataStatus, pageDataSingleton} from '@/data/PageData';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/utils/ComponentsUtils';
import {GeneratorData} from '@/data/GeneratorData';
import {PublishPagesButton} from '@/features/pages/PublishPagesButton';
import {CreateNewPageButton} from '@/features/pages/CreateNewPageButton';
import {DI_PAGE_ROUTE_ROOT} from 'infra-common/constants';
import {useSessionState} from '@/utils/localStorage';
import {PagesNode, findNodeByPath, getParentNodes, findTemplatesByFilter} from '@/data/PagesData.utility';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {PagePreviewPanel} from '@/features/pages/PagePreviewPanel';
import {getNormalizedRoute, fixIndexRoute} from 'infra-common/utility/database';
import {Input} from '@/components/ui/input';
import {EditTemplateTitleButton} from '@/features/pages/EditTemplateTitleButton';
import {siteDataSingleton, SiteDataStatus} from '@/data/SiteData';
import {RevertChangesButton} from '@/features/pages/RevertChangesButton';

export type PagesPreviewRecords = Record<string, { pageId: string; templateId: string; }>;

interface AllPagesViewProps {
    pagesData: PagesData;
    generatorData: GeneratorData;
}

function StatusBadge({status}: { status: SiteDataStatus | PageDataStatus }) {
    if (status === 'changed') {
        return (<Badge variant="destructive" className="whitespace-nowrap">Not Saved</Badge>);
    } else if (status === 'saved') {
        return (<Badge variant="outline">Saved</Badge>);
    }
}

function GeneratorStatus({created, updated, lastRun}: {created: number; updated: number; lastRun: number;}) {
    if (created > 0 && updated > 0) {
        if (created >= lastRun) {
            return (
                <Badge variant="outline" className="bg-blue-100 text-gray-700">New</Badge>
            );
        } else if (updated >= lastRun) {
            return (
                <Badge variant="outline" className="bg-amber-100 text-gray-700">Not Published</Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-gray-100 text-gray-700">Published</Badge>
        );
    }
    return null;
}

function traversePagesNodesForPreviewRecords(pagesNode: PagesNode, pagesPreviewRecords: PagesPreviewRecords): void {
    let foundPageInPreviewRecords = undefined;
    for (const templateItem of pagesNode.templates) {
        if (templateItem.pages && templateItem.pages.length > 0) {
            foundPageInPreviewRecords = templateItem.pages.find(i => i.pageId === pagesPreviewRecords[pagesNode.path]?.pageId);
            if (foundPageInPreviewRecords) {
                break;
            }
        }
    }
    if (!foundPageInPreviewRecords) {
        if (pagesNode.templates[0]?.pages[0].pageId) {
            pagesPreviewRecords[pagesNode.path] = {
                pageId: pagesNode.templates[0].pages[0].pageId,
                templateId: pagesNode.templates[0].templateId
            };
        }
    }
    pagesNode.children.forEach((pagesNoteChild) => traversePagesNodesForPreviewRecords(pagesNoteChild, pagesPreviewRecords));
}

export function AllPagesView(props: AllPagesViewProps) {
    const {pagesData, generatorData} = props;
    const navigate = useNavigate();
    const filterInputRef = useRef<HTMLInputElement>(null);
    const [filterString, setFilterString] = useState<string>();

    const {
        value: currentPath = DI_PAGE_ROUTE_ROOT,
        saveValue: setCurrentPath
    } = useSessionState<string>('pagesViewCurrentPath');

    const {
        value: pagesViewRecords = {},
        saveValue: setPagesViewRecords
    } = useSessionState<PagesPreviewRecords>('pagesViewRecords');

    const {
        value: splitterSizes = [690, 700],
        saveValue: setSplitterSizes
    } = useSessionState<Array<number>>('pagesViewSplitterSizes');

    const debounceChangeFilter = debounce((value: string) => {
        setFilterString(value);
    }, 400);

    const changePreview = (pageId: string, templateId: string) => {
        const newPagePreviewRecords = {...pagesViewRecords};
        if (filterString) {
            newPagePreviewRecords['_filtered'] = {pageId, templateId};
        } else {
            newPagePreviewRecords[currentNode.path] = {pageId, templateId};
        }
        setPagesViewRecords(newPagePreviewRecords);
    };

    const currentNode: PagesNode = useMemo(() => {
        let result: PagesNode = {
            isRoot: true,
            path: DI_PAGE_ROUTE_ROOT,
            dirName: DI_PAGE_ROUTE_ROOT,
            templates: [],
            children: []
        };
        if (pagesData) {
            const {pagesRoots} = pagesData;
            if (filterString) {
                for (const rootTreeNode of pagesRoots) {
                    result.templates = result.templates.concat(findTemplatesByFilter(rootTreeNode, filterString));
                }
                if (result.templates[0]?.pages[0]) {
                    const {pageId, templateId} = result.templates[0].pages[0];
                    changePreview(pageId, templateId);
                }
            } else {
                let foundCurrentDirNodeInNewTree: PagesNode | undefined = undefined;
                for (const rootTreeNode of pagesRoots) {
                    foundCurrentDirNodeInNewTree = findNodeByPath(rootTreeNode, currentPath);
                    if (foundCurrentDirNodeInNewTree) {
                        result = foundCurrentDirNodeInNewTree;
                    }
                }
                if (!foundCurrentDirNodeInNewTree && currentPath !== DI_PAGE_ROUTE_ROOT) {
                    // the path does not have any pages to show, jump to the root...
                    setCurrentPath(DI_PAGE_ROUTE_ROOT);
                }
            }
        }
        return result;
    }, [pagesData, currentPath, filterString]);

    useEffect(() => {
        if (pagesData) {
            const {pagesRoots} = pagesData;
            const newPagesViewRecords = {...pagesViewRecords};
            for (const rootTreeNode of pagesRoots) {
                traversePagesNodesForPreviewRecords(rootTreeNode, newPagesViewRecords);
            }
            setPagesViewRecords(newPagesViewRecords);
        }
    }, [pagesData]);

    const currentPageViewPreviewRecord = filterString ? pagesViewRecords['_filtered'] : pagesViewRecords[currentNode.path];
    const lastRun = Number(generatorData?.generator.Status?.LastRun.N || 0);
    const siteUpdated = Number(pagesData?.siteEntry?.Entry?.EntryUpdateDate.N || 0);

    let folderPath: Array<PagesNode> = currentNode ? getParentNodes(currentNode) : [];
    if (folderPath.length > 3) {
        folderPath = folderPath.slice(-3);
    }

    const handleChangeCurrentPath = (newPath: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentPath(newPath);
    };

    const handleChangePagePreview = (pageId: string, templateId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        changePreview(pageId, templateId);
    };

    const handleChangeFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
        debounceChangeFilter(e.currentTarget.value);
    };

    let status: SiteDataStatus | PageDataStatus = siteDataSingleton.getStatus();

    return (
        <div className="w-full h-full p-4 flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row gap-2 items-center">
                    <div><p className="text-xl">Site Pages</p></div>
                    <div className="w-[350px] relative">
                        <Input
                            ref={filterInputRef}
                            className="pr-[20px] py-0"
                            type="text"
                            placeholder="Search pages..."
                            defaultValue=""
                            onChange={handleChangeFilter}
                        />
                        <div className="absolute right-[5px] top-[12px]">
                            <LucideXCircle
                                className="text-muted-foreground w-4 h-4 cursor-pointer"
                                onClick={() => {
                                    setFilterString('');
                                    if (filterInputRef.current) {
                                        filterInputRef.current.value = '';
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <CreateNewPageButton
                            templateEntries={pagesData?.templateEntries || []}
                            currentPath={currentNode.path}
                        />
                    </div>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <div>
                        <RevertChangesButton
                            siteDataStatus={status}
                            pagesData={pagesData}
                        />
                    </div>
                    <PublishPagesButton
                        generatorData={generatorData}
                        siteDataStatus={status}
                        pagesData={pagesData}
                    />
                </div>
            </div>
            <div className="flex-grow h-full relative">
                <Allotment
                    vertical={false}
                    defaultSizes={splitterSizes}
                    onDragEnd={(sizes) => {
                        setSplitterSizes(sizes);
                    }}
                >
                    <Allotment.Pane minSize={550} className="pr-1">
                        <div className="h-full w-full flex flex-col gap-2">
                            {!filterString && (
                                <div className="flex flex-row justify-between gap-2 items-center pr-1">
                                    <div className="flex flex-row gap-0 items-center flex-nowrap">
                                        {folderPath.map((folder) => {
                                            return (
                                                <React.Fragment key={folder.path}>
                                                    <div>
                                                        {folder.dirName === DI_PAGE_ROUTE_ROOT
                                                            ? (
                                                                <TooltipWrapper text="Go to the root directory">
                                                                    <ButtonAction
                                                                        Icon={LucideHome}
                                                                        variant="ghost"
                                                                        onClick={handleChangeCurrentPath(folder.path)}
                                                                        size="sm"
                                                                        className="px-2"
                                                                    />
                                                                </TooltipWrapper>
                                                            )
                                                            : (
                                                                <ButtonAction
                                                                    label={folder.dirName}
                                                                    onClick={handleChangeCurrentPath(folder.path)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="px-1"
                                                                />
                                                            )
                                                        }
                                                    </div>
                                                    <div>
                                                        <LucideChevronRight className="w-4 h-4"/>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                        <div>
                                            {currentNode.dirName === DI_PAGE_ROUTE_ROOT
                                                ? (
                                                    <ButtonAction
                                                        Icon={LucideHome}
                                                        variant="ghost"
                                                        disabled={true}
                                                        size="sm"
                                                        label="Site Root"
                                                        className="px-1"
                                                    />
                                                )
                                                : (
                                                    <ButtonAction
                                                        label={currentNode.dirName}
                                                        variant="ghost"
                                                        disabled={true}
                                                        size="sm"
                                                        className="px-1"
                                                    />
                                                )
                                            }
                                        </div>
                                    </div>
                                    {/*<div className="flex flex-row gap2 items-center justify-end">*/}
                                    {/*</div>*/}
                                </div>
                            )}
                            <div className="flex-grow relative w-full h-full">
                                <div className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden">
                                    <ScrollArea className="w-full h-full pr-1">
                                        <div className="flex flex-col gap-3 w-full">
                                            {currentNode.children.map((pagesNode, pagesNodeIndex) => {
                                                return (
                                                    <Card className="w-full overflow-hidden" key={pagesNode.path}>
                                                        <Table className="w-full">
                                                            <TableBody>
                                                                <TableRow className="cursor-pointer hover:bg-slate-100"
                                                                          onClick={handleChangeCurrentPath(pagesNode.path)}>
                                                                    <TableCell colSpan={2}>
                                                                        <div
                                                                            className="flex flex-row items-center gap-2 flex-nowrap">
                                                                            {pagesNode.children.length > 0 || pagesNode.templates.length > 0
                                                                                ? (<LucideFolder className="w-4 h-4"/>)
                                                                                : (<LucideFolderMinus
                                                                                    className="w-4 h-4"/>)
                                                                            }
                                                                            <p className="font-bold text-sm">{pagesNode.dirName}</p>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableBody>
                                                        </Table>
                                                    </Card>
                                                );
                                            })}
                                            {currentNode.templates.map((templateRow, templateRowIndex) => {
                                                const {templateTitle, templateId} = templateRow;
                                                return (
                                                    <Card className="w-full overflow-hidden"
                                                          key={`${templateId}_${templateRowIndex}`}>
                                                        <Table>
                                                            <TableBody>
                                                                <TableRow className="bg-slate-100 hover:bg-slate-100">
                                                                    <TableCell colSpan={2} className="py-1">
                                                                        <div className="text-muted-foreground flex flex-row items-center gap-2">
                                                                            <span
                                                                                className="line-clamp-1 text-xs">
                                                                                {templateTitle}
                                                                            </span>
                                                                            <EditTemplateTitleButton
                                                                                templateId={templateId}
                                                                                oldTitle={templateTitle}
                                                                            />
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                                {templateRow.pages.map((pageRow, pageRowIndex) => {
                                                                    const {
                                                                        pageId,
                                                                        lastSaved,
                                                                        pageSlug,
                                                                        pageRoute,
                                                                        pageTitle,
                                                                        isMainPage,
                                                                        created,
                                                                        updated
                                                                    } = pageRow;
                                                                    let pageStatus = status;
                                                                    if (pageStatus !== 'changed') {
                                                                        pageStatus = pageDataSingleton.getStatus(pageId, templateId);
                                                                    }
                                                                    return (
                                                                        <TableRow key={`${pageId}_${pageRowIndex}`}>
                                                                            <TableCell
                                                                                className="font-medium w-full cursor-pointer"
                                                                                onClick={handleChangePagePreview(pageId, templateId)}
                                                                            >
                                                                                <div
                                                                                    className="grid grid-cols-[auto,1fr] items-center gap-2">
                                                                                    {isMainPage
                                                                                        ? (<LucideHome
                                                                                            className="h-4 w-4"/>)
                                                                                        : (<LucideFile
                                                                                            className="h-4 w-4"/>)
                                                                                    }
                                                                                    <div className="line-clamp-1">
                                                                                        <span
                                                                                            className={
                                                                                                cn("hover:underline text-blue-600 cursor-pointer", {
                                                                                                    ['font-bold']: currentPageViewPreviewRecord?.pageId === pageId
                                                                                                })
                                                                                            }
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                e.preventDefault();
                                                                                                navigate(`/edit-page/${pageId}`);
                                                                                            }}
                                                                                        >
                                                                                            {pageTitle}
                                                                                        </span>
                                                                                    </div>
                                                                                    <LucideLink
                                                                                        className="text-muted-foreground w-3 h-3"/>
                                                                                    <p className="line-clamp-1 text-muted-foreground text-xs">{fixIndexRoute(getNormalizedRoute(pageRoute) + pageSlug)}</p>
                                                                                    <div></div>
                                                                                    <div
                                                                                        className="flex flex-row gap-2 items-center">
                                                                                        <div>
                                                                                            <GeneratorStatus
                                                                                                created={created}
                                                                                                updated={siteUpdated > updated ? siteUpdated : templateRow.updated > updated ? templateRow.updated : updated}
                                                                                                lastRun={lastRun}
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <StatusBadge status={pageStatus}/>
                                                                                        </div>
                                                                                        <div>
                                                                                            <p className="text-xs text-muted-foreground">Last
                                                                                                saved {formatDistanceToNow(Number(lastSaved))} ago</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <div
                                                                                    className="flex flex-row items-center justify-end gap-0">
                                                                                    <div>
                                                                                        <CopyPageButton
                                                                                            pageId={pageId}
                                                                                            templateId={templateId}
                                                                                            currentPath={currentPath}
                                                                                        />
                                                                                    </div>
                                                                                    <div>
                                                                                        <PageDropdownMenu
                                                                                            pageId={pageId}
                                                                                            templateId={templateId}
                                                                                            currentPath={currentPath}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        </div>
                    </Allotment.Pane>
                    <Allotment.Pane minSize={350} className="pl-2">
                        <PagePreviewPanel
                            pagesData={pagesData}
                            pageId={currentPageViewPreviewRecord?.pageId}
                            templateId={currentPageViewPreviewRecord?.templateId}
                        />
                    </Allotment.Pane>
                </Allotment>
            </div>
        </div>
    );
}