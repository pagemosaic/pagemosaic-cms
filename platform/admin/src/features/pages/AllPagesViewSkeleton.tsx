import React from 'react';
import {Skeleton} from '@/components/ui/skeleton';
import {Table, TableBody, TableRow, TableCell, TableHead, TableHeader} from '@/components/ui/table';
import {Card} from '@/components/ui/card';

export function AllPagesViewSkeleton() {
    return (
        <div className="w-full h-full p-4 flex flex-col gap-4">
            <div>
                <p className="text-xl">List of Pages</p>
            </div>
            <div className="relative grow">
                <Card className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden">
                    <Table className="w-full">
                        <TableHeader>
                            <tr>
                                <TableHead className="flex flex-row items-center flex-nowrap gap-2">
                                    <div>Page</div>
                                </TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead className="whitespace-nowrap">Last Modified</TableHead>
                                <TableHead></TableHead>
                            </tr>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    <Skeleton className="w-[150px] h-[2.5em]"/>
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="w-[150px] h-[2.5em]"/>
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="w-full h-[2.5em]"/>
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="w-[150px] h-[2.5em]"/>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}