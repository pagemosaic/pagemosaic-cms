import React, {useMemo} from 'react';
import set from 'lodash-es/set';
import get from 'lodash-es/get';
import {ContentData} from 'infra-common/data/ContentData';
import {BrowsePagesButton} from '@/features/editPage/BrowsePagesButton';
import {PagesData} from '@/data/PagesData';
import {getIdFromPK} from 'infra-common/utility/database';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {LucideX} from 'lucide-react';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';
import {useNavigate} from 'react-router-dom';

interface ControlLinkProps {
    controlKey: number;
    contentData: ContentData;
    fieldPath: string;
    pagesData: PagesData;
    disabled?: boolean;
    onChange: (newContentData: ContentData, doRefresh?: boolean) => void;
}

export function ControlLink(props: ControlLinkProps) {
    const {controlKey, contentData, fieldPath, pagesData, disabled = false, onChange} = props;
    const navigate = useNavigate();
    return useMemo(() => {
        const fieldPathValue = `${fieldPath}.pageId`;
        const handlePageSelect = (selectedPageId: string) => {
            if (contentData) {
                const newContentData = set(contentData, fieldPathValue, selectedPageId);
                onChange(newContentData, true);
            }
        };

        let defaultStringValue = get(
            contentData,
            fieldPathValue,
            undefined
        ) as string | undefined;

        const selectedPageTitle = defaultStringValue
            ? pagesData?.pageEntries.find(i => getIdFromPK(i.Entry?.PK.S) === defaultStringValue)?.Meta?.PageTitle.S || 'The page is not found'
            : 'No page selected';

        return (
            <div className="flex flex-row gap-2">
                {selectedPageTitle === 'No page selected' && (
                    <div className="flex flex-row gap-2 flex-nowrap items-center px-3 py-1 rounded-2xl border-dashed border-[1px] border-slate-200 text-sm text-muted-foreground">
                        {selectedPageTitle}
                    </div>
                )}
                {selectedPageTitle === 'The page is not found' && (
                    <div className="flex flex-row gap-2 flex-nowrap items-center px-3 py-1 rounded-2xl border-solid border-[1px] border-orange-400 text-sm text-muted-foreground">
                        {selectedPageTitle}
                    </div>
                )}
                {selectedPageTitle !== 'No page selected' && selectedPageTitle !== 'The page is not found' && (
                    <div className="flex flex-row gap-2 flex-nowrap items-center px-3 py-1 rounded-2xl bg-slate-200 max-w-[450px]">
                        <TooltipWrapper text={selectedPageTitle}>
                            <span className="text-sm line-clamp-1 text-blue-600 hover:underline cursor-pointer" onClick={() => {navigate(`/edit-page/${defaultStringValue}`, { replace: true });}}>
                                {selectedPageTitle}
                            </span>
                        </TooltipWrapper>
                        <ButtonAction size="xxs" variant="ghost" Icon={LucideX} onClick={() => handlePageSelect('')}/>
                    </div>
                )}
                <div>
                    <BrowsePagesButton disabled={disabled} label="Select Page" onSelect={handlePageSelect}/>
                </div>
            </div>
        );
    }, [controlKey]);
}
