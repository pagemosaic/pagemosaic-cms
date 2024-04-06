import React, {useContext} from 'react';
import {DI_PageEntry} from 'infra-common/data/DocumentItem';
import {getIdFromPK} from 'infra-common/utility/database';
import {cloneDeep} from 'infra-common/utility/objectUtils';
import {PageDataSessionKeys} from '@/data/PageData';
import {HistoryDataItem, historyDataSingleton} from '@/data/HistoryData';
import {getSessionState, setSessionState} from '@/utils/localStorage';

export type HistoryDataProviderContextProps = {
    putIntoHistory: (historyRecord: HistoryDataItem) => void;
};

interface HistoryDataProviderProps {
    pageSessionKeys: PageDataSessionKeys;
    children: React.ReactNode;
}

export const HistoryDataContext = React.createContext<HistoryDataProviderContextProps>({
    putIntoHistory: () => {}
});

export function HistoryDataProvider(props: HistoryDataProviderProps) {
    const {pageSessionKeys, children} = props;
    const pageEntry = getSessionState<DI_PageEntry>(pageSessionKeys.tempPageSessionKey);
    const pageId = getIdFromPK(pageEntry?.Entry?.PK.S);

    const handlePutIntoHistory = (historyRecord: HistoryDataItem) => {
        if (pageId) {
            const {pageEntry, templateEntry, siteEntry} = historyRecord;
            historyDataSingleton.putIntoHistory(pageId, {
                pageEntry: pageEntry ? cloneDeep(pageEntry) : undefined,
                siteEntry: siteEntry ? cloneDeep(siteEntry) : undefined,
                templateEntry: templateEntry ? cloneDeep(templateEntry) : undefined
            });
            setSessionState('thereAreChanges', true);
        }
    };

    return (
        <HistoryDataContext.Provider value={{putIntoHistory: handlePutIntoHistory}}>
            {children}
        </HistoryDataContext.Provider>
    );
}

export const useHistoryData = () => {
    const context = useContext(HistoryDataContext);
    if (!context) {
        throw new Error('useHistoryData must be used within a HistoryDataProvider');
    }
    return context;
};
