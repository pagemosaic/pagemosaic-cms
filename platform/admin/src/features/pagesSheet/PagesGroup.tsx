import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card} from '@/components/ui/card';
import {Table, TableRow, TableCell, TableBody} from '@/components/ui/table';
import {PagesNode} from '@/data/PagesData.utility';
import {usePagesSheet} from '@/features/pagesSheet/PagesSheetProvider';
import {cn} from '@/utils/ComponentsUtils';
import {getNormalizedRoute} from 'infra-common/utility/database';

interface PagesGroupProps {
    pagesNode: PagesNode;
    currentPageId?: string;
}

export function PagesGroup(props: PagesGroupProps) {
    const {pagesNode, currentPageId} = props;
    const navigate = useNavigate();
    const {closePagesTree} = usePagesSheet();
    return (
        <Card className="w-full overflow-hidden">
            <Table>
                <TableBody>
                    <TableRow className="bg-slate-200 hover:bg-slate-200">
                        <TableCell className="py-1">
                            <span
                                className="text-xs text-muted-foreground font-semibold line-clamp-1">
                                {getNormalizedRoute(pagesNode.path)}
                            </span>
                        </TableCell>
                    </TableRow>
                    {pagesNode.templates.map((nodeTemplates) => {
                        if (nodeTemplates.pages.length > 0) {
                            return nodeTemplates.pages.map((pageItem) => {
                                return (
                                    <TableRow key={pageItem.pageId}>
                                        <TableCell
                                            className="pointer-events-auto hover:underline text-blue-600 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                closePagesTree();
                                                navigate(`/edit-page/${pageItem.pageId}`, {replace: true});
                                            }}
                                        >
                                            <span
                                                className={cn('text-sm line-clamp-1', {['font-bold']: pageItem.pageId === currentPageId})}>
                                                {pageItem.pageTitle}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                );
                            });
                        }
                    })}
                </TableBody>
            </Table>
        </Card>
    );
}