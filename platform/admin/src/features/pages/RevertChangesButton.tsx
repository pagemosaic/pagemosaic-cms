import React, {useMemo} from 'react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {LucideUndo2, LucideCheck} from 'lucide-react';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {PagesData} from '@/data/PagesData';
import {SiteDataStatus} from '@/data/SiteData';
import {DI_PageEntry} from 'infra-common/data/DocumentItem';
import {PageDataStatus, pageDataSingleton} from '@/data/PageData';
import {getIdFromPK} from 'infra-common/utility/database';

interface RevertChangesButtonProps {
    siteDataStatus: SiteDataStatus;
    pagesData: PagesData;
}

export function RevertChangesButton(props: RevertChangesButtonProps) {
    const {siteDataStatus, pagesData} = props;
    const {showDialog} = useActionForm();

    const changedPages: Array<DI_PageEntry> = useMemo(() => {
        const result: Array<DI_PageEntry> = [];
        if (pagesData) {
            let status: PageDataStatus;
            const {pageEntries = []} = pagesData;
            for (const pageEntry of pageEntries) {
                status = pageDataSingleton.getStatus(getIdFromPK(pageEntry.Entry?.PK.S), pageEntry.Meta?.PageTemplateId.S || '');
                if (status === 'changed') {
                    result.push(pageEntry);
                }
            }
        }
        return result;
    }, [pagesData]);

    const handleSaveChanges = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        showDialog({
            title: 'Do you want to revert all changes?',
            description: 'This action cannot be undone.',
            action: 'revertChanges',
            formDataParams: {},
            Icon: LucideCheck
        });
    };

        return (
            <ButtonAction
                Icon={LucideUndo2}
                variant="outline"
                size="default"
                label="Revert Changes"
                disabled={siteDataStatus !== 'changed' && changedPages.length === 0}
                onClick={handleSaveChanges}
            />
        );
}