import React from 'react';
import {BrowsePagesButton} from '@/features/editPage/BrowsePagesButton';
import {PagesData} from '@/data/PagesData';
import {getIdFromPK} from 'infra-common/utility/database';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {LucideDelete, LucideTrash2, LucideX, LucidePlus} from 'lucide-react';
import {useNavigate} from 'react-router-dom';

interface MetaBacklinksProps {
    pagesData: PagesData;
    disabled?: boolean;
    backlinks?: string;
    onChange: (backlinks: string) => void;
}

export function MetaBacklinks(props: MetaBacklinksProps) {
    const {backlinks, pagesData, disabled = false, onChange} = props;
    const navigate = useNavigate();

    const linkList: Array<string> = JSON.parse(backlinks || '[]');

    const handlePageSelect = (pageId: string) => {
        const newLinks = [...linkList];
        newLinks.push(pageId);
        onChange(JSON.stringify(newLinks));
    };

    const handlePageDelete = (index: number) => () => {
        const newLinks = [...linkList];
        newLinks.splice(index, 1);
        onChange(JSON.stringify(newLinks));
    };

    return (
        <div className="flex flex-col gap-2 items-start">
            <div className="flex flex-row gap-2 items-center justify-start">
            {linkList.map((linkItem, idx) => {
                return (
                    <div key={`${linkItem}_${idx}`}>
                        <div className="flex flex-row gap-2 flex-nowrap items-center px-3 py-1 rounded-2xl bg-slate-200">
                            <div>
                            <span className="text-sm line-clamp-1 text-blue-600 hover:underline cursor-pointer max-w-[200px]" onClick={() => navigate(`/edit-page/${linkItem}`, {replace: true})}>
                                {pagesData?.pageEntries.find(i => getIdFromPK(i.Entry?.PK.S) === linkItem)?.Meta?.PageTitle.S || 'The page is not found'}
                            </span>
                            </div>
                            <ButtonAction size="xxs" variant="ghost" Icon={LucideX} onClick={handlePageDelete(idx)}/>
                        </div>
                    </div>
                );
            })}
            </div>
            <div>
                <BrowsePagesButton
                    label="Add Page"
                    Icon={LucidePlus}
                    disabled={disabled}
                    onSelect={handlePageSelect}
                />
            </div>
        </div>
    );

}
