import React, {useContext, useRef} from 'react';
import {PagesData} from '@/data/PagesData';
import {PagesSheepHandler, PagesSheet} from './PagesSheet';

export type PagesSheetProviderContextProps = {
    openPagesTree: () => void;
    closePagesTree: () => void;
    togglePagesTree: () => void;
};

interface PagesSheetProviderProps {
    pagesData: PagesData;
    children: React.ReactNode;
}

export const PagesSheetContext = React.createContext<PagesSheetProviderContextProps>({
    openPagesTree: () => {},
    closePagesTree: () => {},
    togglePagesTree: () => {},
});

export function PagesSheetProvider(props: PagesSheetProviderProps) {
    const {pagesData, children} = props;
    const pagesSheetRef = useRef<PagesSheepHandler>(null);

    const handleOpenPagesTree = () => {
        if (pagesSheetRef.current) {
            pagesSheetRef.current.openPagesTree();
        }
    };

    const handleClosePagesTree = () => {
        if (pagesSheetRef.current) {
            pagesSheetRef.current.closePagesTree();
        }
    };

    const handleTogglePagesTree = () => {
        if (pagesSheetRef.current) {
            pagesSheetRef.current.togglePagesTree();
        }
    };

    return (
        <PagesSheetContext.Provider
            value={{
                openPagesTree: handleOpenPagesTree,
                closePagesTree: handleClosePagesTree,
                togglePagesTree: handleTogglePagesTree
            }}
        >
            <PagesSheet
                ref={pagesSheetRef}
                pagesData={pagesData}
            />
            {children}
        </PagesSheetContext.Provider>
    );
}

export const usePagesSheet = () => {
    const context = useContext(PagesSheetContext);
    if (!context) {
        throw new Error('usePagesSheet must be used within a PagesSheetProvider');
    }
    return context;
};
