import React, {useMemo} from 'react';
import {
    LucideHome,
    LucideFolder,
    LucideChevronRight,
    LucideFolderMinus,
} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {
    Table,
    TableBody,
    TableCell,
    TableRow
} from '@/components/ui/table';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Card} from '@/components/ui/card';
import {useSessionState} from '@/utils/localStorage';
import {DI_PAGE_ROUTE_ROOT} from 'infra-common/constants';
import {PagesData} from '@/data/PagesData';
import {PagesNode, findNodeByPath, getParentNodes} from '@/data/PagesData.utility';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';
import {getNormalizedRoute, fixIndexRoute} from 'infra-common/utility/database';

interface PagesBrowserProps {
    pagesData: PagesData;
    onSelect: (pageId: string, url: string, pageTitle: string) => void;
}

export function PagesBrowser(props: PagesBrowserProps) {
    const {pagesData, onSelect} = props;
    const {
        value: currentPath = DI_PAGE_ROUTE_ROOT,
        saveValue: setCurrentPath
    } = useSessionState<string>('pagesBrowserCurrentPath');

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
            let foundCurrentDirNodeInNewTree: PagesNode | undefined = undefined;
            for (const rootTreeNode of pagesRoots) {
                foundCurrentDirNodeInNewTree = findNodeByPath(rootTreeNode, currentPath);
                if (foundCurrentDirNodeInNewTree) {
                    result = foundCurrentDirNodeInNewTree;
                }
            }
        }
        return result;
    }, [pagesData, currentPath]);

    let folderPath: Array<PagesNode> = currentNode ? getParentNodes(currentNode) : [];
    if (folderPath.length > 3) {
        folderPath = folderPath.slice(-3);
    }

    const handleChangeCurrentPath = (newPath: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentPath(newPath);
    };

    const handleSelectItem = (pageId: string, url: string, pageTitle: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect(pageId, url, pageTitle);
    };

    return (
        <div className="w-full h-[450px] flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center flex-nowrap">
                {folderPath.map((folder) => {
                    return (
                        <React.Fragment key={folder.path}>
                            <div>
                                {folder.dirName === DI_PAGE_ROUTE_ROOT
                                    ? (
                                        <TooltipWrapper text="Go to the root">
                                            <ButtonAction
                                                Icon={LucideHome}
                                                variant="ghost"
                                                onClick={handleChangeCurrentPath(folder.path)}
                                                size="sm"
                                            />
                                        </TooltipWrapper>
                                    )
                                    : (
                                        <ButtonAction
                                            label={folder.dirName}
                                            onClick={handleChangeCurrentPath(folder.path)}
                                            variant="ghost"
                                            size="sm"
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
                            />
                        )
                        : (
                            <ButtonAction
                                label={currentNode.dirName}
                                variant="ghost"
                                disabled={true}
                                size="sm"
                            />
                        )
                    }
                </div>
            </div>
            <div className="relative grow">
                <ScrollArea className="w-full h-full">
                    <div className="flex flex-col gap-3 w-full">
                        {currentNode.children.map((pagesNode, pagesNodeIndex) => {
                            return (
                                <Card className="w-full overflow-hidden" key={pagesNode.path}>
                                    <Table className="w-full">
                                        <TableBody>
                                            <TableRow className="cursor-pointer hover:bg-slate-100" onClick={handleChangeCurrentPath(pagesNode.path)}>
                                                <TableCell>
                                                    <div
                                                        className="flex flex-row items-center gap-2 flex-nowrap">
                                                        {pagesNode.children.length > 0 || pagesNode.templates.length > 0
                                                            ? (<LucideFolder className="w-4 h-4"/>)
                                                            : (<LucideFolderMinus className="w-4 h-4"/>)
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
                                                <TableCell className="py-1">
                                                    <div className="w-full flex items-center justify-between">
                                                        <div>
                                                            <span className="line-clamp-1 text-muted-foreground text-xs">
                                                                {templateTitle}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {templateRow.pages.map((pageRow, pageRowIndex) => {
                                                const {
                                                    pageId,
                                                    pageSlug,
                                                    pageRoute,
                                                    pageTitle
                                                } = pageRow;
                                                return (
                                                    <TableRow key={`${pageId}_${pageRowIndex}`}>
                                                        <TableCell className="font-medium w-full">
                                                            <div className="line-clamp-1">
                                                                <span
                                                                    className="hover:underline text-blue-600 cursor-pointer"
                                                                    onClick={handleSelectItem(
                                                                        pageId,
                                                                        fixIndexRoute(getNormalizedRoute(pageRoute) + pageSlug),
                                                                        pageTitle
                                                                    )}
                                                                >
                                                                    {pageTitle}
                                                                </span>
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
    );
}
