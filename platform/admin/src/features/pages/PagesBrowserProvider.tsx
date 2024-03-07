import React, {useState, useRef, useEffect, useContext} from 'react';
import {AsyncStatus, AsyncStatusProvider} from '@/components/utils/AsyncStatusProvider';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {PagesData, pagesDataSingleton} from '@/data/PagesData';
import {PagesBrowser} from '@/features/pages/PagesBrowser';

type DialogOptions = {
    title: string;
    onSelect: (pageId: string, url: string, pageTitle: string) => void;
};

interface PagesBrowserProviderProps {
    children: React.ReactNode;
}

export const PagesBrowserContext = React.createContext<{
    showDialog: (options: DialogOptions) => void;
} | null>(null);

export function PagesBrowserProvider(props: PagesBrowserProviderProps) {
    const {children} = props;
    const [dialogOptions, setDialogOptions] = useState<DialogOptions>();
    const [open, setOpen] = useState<boolean>(false);
    const [status, setStatus] = useState<AsyncStatus>({isUninitialized: true});
    const pagesDataRef = useRef<PagesData>(null);

    const reloadData = () => {
        setStatus({isLoading: true});
        pagesDataSingleton.getPagesData()
            .then((pagesData: PagesData) => {
                pagesDataRef.current = pagesData;
                setStatus({isSuccess: true});
            })
            .catch((e: any) => {
                setStatus({isError: true, error: e.message});
            });
    };

    const handleOnSelect = (pageId: string, url: string, pageTitle: string) => {
        setOpen(false);
        if (dialogOptions) {
            dialogOptions.onSelect(pageId, url, pageTitle);
        }
    };

    useEffect(() => {
        if (open) {
            reloadData();
        }
    }, [open]);

    const showDialog = (options: DialogOptions): void => {
        setDialogOptions(options);
        setOpen(true);
    };

    return (
        <PagesBrowserContext.Provider value={{showDialog}}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl bg-slate-50" onOpenAutoFocus={e => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>{dialogOptions?.title || 'Pages'}</DialogTitle>
                        {status.isError && (
                            <div>
                                <p className="text-xs text-red-600">{status.error}</p>
                            </div>
                        )}
                    </DialogHeader>
                    <div>
                        {(status.isLoading || status.isUninitialized)
                            ? (
                                <div className="w-full h-[450px] flex flex-col items-center justify-center">
                                    <p>Loading...</p>
                                </div>
                            )
                            : (
                                <AsyncStatusProvider>
                                    <PagesBrowser
                                        pagesData={pagesDataRef.current}
                                        onSelect={handleOnSelect}
                                    />
                                </AsyncStatusProvider>
                            )
                        }
                    </div>
                </DialogContent>
            </Dialog>
        </PagesBrowserContext.Provider>
    );
}

export const usePagesBrowser = () => {
    const context = useContext(PagesBrowserContext);
    if (!context) {
        throw new Error('usePagesBrowser must be used within a PagesBrowserProvider');
    }
    return context;
};
