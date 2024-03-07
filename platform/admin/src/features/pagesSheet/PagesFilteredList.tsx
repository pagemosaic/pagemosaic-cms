import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card} from '@/components/ui/card';
import {Table, TableRow, TableCell} from '@/components/ui/table';
import {usePagesSheet} from '@/features/pagesSheet/PagesSheetProvider';
import {cn} from '@/utils/ComponentsUtils';
import {DI_PageEntry} from 'infra-common/data/DocumentItem';
import {getIdFromPK} from 'infra-common/utility/database';

interface PagesFilteredListProps {
    pages: Array<DI_PageEntry>;
    filterString: string;
    currentPageId?: string;
}

export function PagesFilteredList(props: PagesFilteredListProps) {
    const {pages, filterString, currentPageId} = props;
    const navigate = useNavigate();
    const {closePagesTree} = usePagesSheet();
    const lowerCaseFilter = filterString.toLowerCase();
    const filteredPages = pages.filter(p => p.Meta?.PageTitle.S.toLowerCase().includes(lowerCaseFilter));
    return (
        <Card className="w-full overflow-hidden">
            <Table>
                {filteredPages.map((page) => {
                    const pageId = getIdFromPK(page.Entry?.PK.S);
                    return (
                        <TableRow key={pageId}>
                            <TableCell
                                className="pointer-events-auto hover:underline text-blue-600 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    closePagesTree();
                                    navigate(`/edit-page/${pageId}`, { replace: true });
                                }}
                            >
                                <span className={cn('text-sm line-clamp-1', {['font-bold']: pageId === currentPageId})}>
                                    {page.Meta?.PageTitle.S}
                                </span>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </Table>
        </Card>
    );
}