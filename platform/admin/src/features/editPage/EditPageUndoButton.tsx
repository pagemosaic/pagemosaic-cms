import {LucideUndo2} from 'lucide-react';
import {PageDataSessionKeys} from '@/data/PageData';
import {SiteDataSessionKeys} from '@/data/SiteData';
import {useSessionState} from '@/utils/localStorage';
import {DI_PageEntry, DI_TemplateEntry, DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {historyDataSingleton} from '@/data/HistoryData';
import {getIdFromPK} from 'infra-common/utility/database';

interface EditPageHistoryButtonProps {
    pageSessionKeys: PageDataSessionKeys;
    siteSessionKeys: SiteDataSessionKeys;
}

export function EditPageUndoButton(props: EditPageHistoryButtonProps) {
    const {pageSessionKeys, siteSessionKeys} = props;
    const {tempPageSessionKey, tempTemplateSessionKey} = pageSessionKeys;
    const {tempSiteSessionKey} = siteSessionKeys;
    const {value: tempPageEntry, saveValue: setTempPageEntry} = useSessionState<DI_PageEntry>(tempPageSessionKey);
    const {saveValue: setTempTemplateEntry} = useSessionState<DI_TemplateEntry>(tempTemplateSessionKey);
    const {saveValue: setTempSiteEntry} = useSessionState<DI_SiteEntry>(tempSiteSessionKey);
    const {
        value: pageContentUniqueKey = 0,
        saveValue: setPageContentUniqueKey
    } = useSessionState<number>('pageContentUniqueKey');

    const pageId = getIdFromPK(tempPageEntry?.Entry?.PK.S);

    const handleUndoClick = () => {
        const lastHistoryRecord = historyDataSingleton.getFromHistory(pageId);
        if (lastHistoryRecord) {
            const {siteEntry, templateEntry, pageEntry} = lastHistoryRecord;
            if (siteEntry || templateEntry || pageEntry) {
                if (siteEntry) {
                    setTempSiteEntry(siteEntry);
                }
                if (templateEntry) {
                    setTempTemplateEntry(templateEntry);
                }
                if (pageEntry) {
                    setTempPageEntry(pageEntry);
                }
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    };

    return (
        <ButtonAction
            size="sm"
            variant="outline"
            label="Undo"
            Icon={LucideUndo2}
            disabled={historyDataSingleton.getHistoryLength(pageId) === 0}
            onClick={handleUndoClick}
        />
    );
}
