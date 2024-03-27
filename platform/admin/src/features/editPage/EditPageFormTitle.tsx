import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {LucideX, LucideMenu} from 'lucide-react';
import {PageDataSessionKeys} from '@/data/PageData';
import {useSessionState, getSessionState, setSessionState} from '@/utils/localStorage';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {DI_PageEntry, DI_TemplateEntry, DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {getIdFromPK} from 'infra-common/utility/database';
import {SiteDataSessionKeys} from '@/data/SiteData';
import {PagesPreviewRecords} from '@/features/pages/AllPagesView';
import {extractClassNames} from '@/utils/CssUtils';
import {EditPageMetaButton} from '@/features/editPage/EditPageMetaButton';
import {usePagesSheet} from '@/features/pagesSheet/PagesSheetProvider';
import {EditPageUndoButton} from '@/features/editPage/EditPageUndoButton';

interface EditPageFormTitleProps {
    pageSessionKeys: PageDataSessionKeys;
    siteSessionKeys: SiteDataSessionKeys;
}

export function EditPageFormTitle(props: EditPageFormTitleProps) {
    const {pageSessionKeys, siteSessionKeys} = props;
    const navigate = useNavigate();
    const {togglePagesTree} = usePagesSheet();
    const {tempPageSessionKey, savedPageSessionKey, tempTemplateSessionKey} = pageSessionKeys;
    const {tempSiteSessionKey} = siteSessionKeys;
    const {value: tempPageEntry} = useSessionState<DI_PageEntry>(tempPageSessionKey);
    const {value: tempTemplateEntry} = useSessionState<DI_TemplateEntry>(tempTemplateSessionKey);
    const {value: tempSiteEntry} = useSessionState<DI_SiteEntry>(tempSiteSessionKey);

    const savedPageEntry = getSessionState<DI_PageEntry>(savedPageSessionKey);

    const pageId = getIdFromPK(savedPageEntry?.Entry?.PK.S);
    const templateId = savedPageEntry?.Meta?.PageTemplateId.S || '';

    const handleClose = () => {
        navigate(-1);
    };

    useEffect(() => {
        // change preview implicitly to the currently edited page
        if (savedPageEntry?.Meta?.PageRoute.S) {
            setSessionState('pagesViewCurrentPath', savedPageEntry?.Meta?.PageRoute.S);
            let pagesViewRecords = getSessionState<PagesPreviewRecords>('pagesViewRecords');
            pagesViewRecords = {...pagesViewRecords, [savedPageEntry?.Meta?.PageRoute.S]: {
                pageId,
                templateId
            }};
            setSessionState('pagesViewRecords', pagesViewRecords);
        }
    }, []);

    useEffect(() => {
        const siteStyles = tempSiteEntry?.SiteStyles || '';
        const styles = tempTemplateEntry?.Styles || '';
        setSessionState('codeEditorHtmlSuggestions', {
            suggestionsForClasses: [...extractClassNames(styles), ...extractClassNames(siteStyles)],
            suggestionsForObjects: []
        });
    }, [
        tempSiteEntry?.SiteContent?.SiteContentData.S,
        tempPageEntry?.Content?.PageContentData.S,
        tempSiteEntry?.SiteStyles,
        tempTemplateEntry?.Styles
    ]);

    return (
        <div className="flex flex-row justify-between items-center">
            <input type="hidden" name="tempSessionKey" value={pageSessionKeys.tempPageSessionKey}/>
            <div className="flex flex-row gap-2 items-center">
                <ButtonAction
                    variant="ghost"
                    size="sm"
                    Icon={LucideMenu}
                    onClick={togglePagesTree}
                />
                <div className="max-w-[600px] line-clamp-1">
                    <p className="text-xl">{tempPageEntry?.Meta?.PageTitle.S}</p>
                </div>
                {tempPageEntry?.Meta && (
                    <EditPageMetaButton
                        pageId={pageId}
                        templateId={templateId}
                        meta={tempPageEntry.Meta}
                    />
                )}
                <EditPageUndoButton
                    pageSessionKeys={pageSessionKeys}
                    siteSessionKeys={siteSessionKeys}
                />
            </div>
            <div className="flex flex-row gap-2 items-center">
                <ButtonAction
                    onClick={handleClose}
                    variant="ghost"
                    size="sm"
                    Icon={LucideX}
                    label="Close"
                />
            </div>
        </div>
    );
}