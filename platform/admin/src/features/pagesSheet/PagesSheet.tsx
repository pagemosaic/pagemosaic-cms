import React, {RefAttributes, forwardRef, useImperativeHandle, useState, useRef} from 'react';
import {Sheet, SheetContent} from '@/components/ui/sheet';
import {PagesData, PagesRoots} from '@/data/PagesData';
import {PagesGroup} from '@/features/pagesSheet/PagesGroup';
import {useParams} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {LucideXCircle} from 'lucide-react';
import debounce from 'lodash-es/debounce';
import {PagesFilteredList} from '@/features/pagesSheet/PagesFilteredList';
import {useSessionState} from '@/utils/localStorage';

export type PagesSheepHandler = {
    openPagesTree: () => void;
    closePagesTree: () => void;
    togglePagesTree: () => void;
};

export type PagesSheetProps = RefAttributes<PagesSheepHandler> & {
    pagesData: PagesData;
}

export const PagesSheet = forwardRef<PagesSheepHandler, PagesSheetProps>((props, ref) => {
    const {pagesData} = props;
    const {pageId: currentPageId} = useParams();
    const [open, setOpen] = useState<boolean>(false);
    const filterInputRef = useRef<HTMLInputElement>(null);
    const {value: filterString = '', saveValue: setFilterString} = useSessionState<string>('pagesSheetFilter');

    useImperativeHandle(ref, () => ({
        closePagesTree: () => {
            setOpen(false);
        },
        openPagesTree: () => {
            setOpen(true);
        },
        togglePagesTree: () => {
            setOpen(!open);
        }
    }));

    const debounceChangeFilter = debounce((value: string) => {
        setFilterString(value);
    }, 400);

    const handleChangeFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
        debounceChangeFilter(e.currentTarget.value);
    };

    const renderPagesGroups = (pagesRoots: PagesRoots): Array<any> => {
        let result: Array<any> = [];
        pagesRoots.forEach(pagesRootsItem => {
            result.push(
                <PagesGroup key={pagesRootsItem.path} pagesNode={pagesRootsItem} currentPageId={currentPageId} />
            )
            result = result.concat(renderPagesGroups(pagesRootsItem.children));
        });
        return result;
    };

    return (
        <Sheet open={open} onOpenChange={setOpen} modal={true}>
            <SheetContent
                className="w-[600px] sm:w-[540px] bg-slate-50"
                side="left"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex flex-col gap-2 w-full h-full">
                    <div>
                        <p className="text-sm">Pages List</p>
                    </div>
                    <div className="w-full relative">
                            <Input
                                ref={filterInputRef}
                                className="pr-[20px] py-0"
                                type="text"
                                placeholder="Filter pages..."
                                defaultValue={filterString}
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
                    <div className="flex-grow relative w-full h-full pb-20 overflow-auto">
                        <div className="flex flex-col gap-2">
                            {filterString && pagesData?.pageEntries && (
                                <PagesFilteredList pages={pagesData?.pageEntries} filterString={filterString} />
                            )}
                            {!filterString && pagesData?.pagesRoots && renderPagesGroups(pagesData.pagesRoots)}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
});
