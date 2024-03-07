import React, {useContext, useRef} from 'react';
import {HelpSheet, HelpSheepHandler} from '@/features/helpSheet/HelpSheet';
import {PageDataSessionKeys} from '@/data/PageData';
import {SiteDataSessionKeys} from '@/data/SiteData';
import {PagesData} from '@/data/PagesData';

export type HelpSheetProviderContextProps = {
    openHelp: () => void;
    closeHelp: () => void;
    toggleHelp: () => void;
};

interface HelpSheetProviderProps {
    pagesData: PagesData;
    pageSessionKeys: PageDataSessionKeys;
    siteSessionKeys: SiteDataSessionKeys;
    children: React.ReactNode;
}

export const HelpSheetContext = React.createContext<HelpSheetProviderContextProps>({
    openHelp: () => {},
    closeHelp: () => {},
    toggleHelp: () => {},
});

export function HelpSheetProvider(props: HelpSheetProviderProps) {
    const {pagesData, pageSessionKeys, siteSessionKeys, children} = props;
    const helpSheetRef = useRef<HelpSheepHandler>(null);

    const handleOpenHelp = () => {
        if (helpSheetRef.current) {
            helpSheetRef.current.openHelp();
        }
    };

    const handleCloseHelp = () => {
        if (helpSheetRef.current) {
            helpSheetRef.current.closeHelp();
        }
    };

    const handleToggleHelp = () => {
        if (helpSheetRef.current) {
            helpSheetRef.current.toggleHelp();
        }
    };

    return (
        <HelpSheetContext.Provider
            value={{
                openHelp: handleOpenHelp,
                closeHelp: handleCloseHelp,
                toggleHelp: handleToggleHelp
            }}
        >
            <HelpSheet
                ref={helpSheetRef}
                pagesData={pagesData}
                pageSessionKeys={pageSessionKeys}
                siteSessionKeys={siteSessionKeys}
            />
            {children}
        </HelpSheetContext.Provider>
    );
}

export const useHelpSheet = () => {
    const context = useContext(HelpSheetContext);
    if (!context) {
        throw new Error('useHelpSheet must be used within a HelpSheetProvider');
    }
    return context;
};
