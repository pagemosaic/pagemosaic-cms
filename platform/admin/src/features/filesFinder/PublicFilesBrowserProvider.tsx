import React, {useState, useRef, useEffect, useContext} from 'react';
import {AsyncStatus, AsyncStatusProvider} from '@/components/utils/AsyncStatusProvider';
import {PublicBucketStaticData, publicBucketDataSingleton} from '@/data/PublicBucketData';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {useSessionState} from '@/utils/localStorage';
import {FilesBrowser} from './FilesBrowser';
import {ExternalImagePreview} from './ExternalImagePreview';

type DialogOptions = {
    title: string;
    onSelect: (url: string) => void;
};

interface PublicFilesBrowserProviderProps {
    children: React.ReactNode;
}

export const PublicFilesBrowserContext = React.createContext<{
    showDialog: (options: DialogOptions) => void;
} | null>(null);

export function PublicFilesBrowserProvider(props: PublicFilesBrowserProviderProps) {
    const {children} = props;
    const [dialogOptions, setDialogOptions] = useState<DialogOptions>();
    const [open, setOpen] = useState<boolean>(false);
    const [status, setStatus] = useState<AsyncStatus>({isUninitialized: true});
    const publicBucketDataRef = useRef<PublicBucketStaticData>(null);
    const {value: selectedTab = 'stored', saveValue: setSelectedTab} = useSessionState<string>('publicFilesBrowserSelectedTab');

    const reloadData = () => {
        setStatus({isLoading: true});
        publicBucketDataSingleton.getPublicStaticFiles()
            .then((publicBucketData: PublicBucketStaticData) => {
                publicBucketDataRef.current = publicBucketData;
                setStatus({isSuccess: true});
            })
            .catch((e: any) => {
                setStatus({isError: true, error: e.message});
            });
    };

    const handleOnSelect = (url: string) => {
        setOpen(false);
        if (dialogOptions) {
            dialogOptions.onSelect(url);
        }
    };

    const handleOnUpload = () => {
        reloadData();
    };

    useEffect(() => {
        reloadData();
    }, []);

    const showDialog = (options: DialogOptions): void => {
        setDialogOptions(options);
        setOpen(true);
    };

    return (
        <PublicFilesBrowserContext.Provider value={{showDialog}}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl bg-slate-50">
                    <DialogHeader>
                        <DialogTitle>{dialogOptions?.title || 'Public Files'}</DialogTitle>
                        {status.isError && (
                            <div>
                                <p className="text-xs text-red-600">{status.error}</p>
                            </div>
                        )}
                    </DialogHeader>
                    <Tabs
                        defaultValue={selectedTab}
                        onValueChange={(newValue: string) => setSelectedTab(newValue)}
                        className="flex flex-col gap-2 w-full h-full"
                    >
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="stored">
                                Stored Files
                            </TabsTrigger>
                            <TabsTrigger value="external">
                                External Link
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex-grow relative w-full h-full">
                            <TabsContent value="stored">
                                {(status.isLoading || status.isUninitialized)
                                    ? (
                                        <div className="w-full h-[450px] flex flex-col items-center justify-center">
                                            <p>Loading...</p>
                                        </div>
                                    )
                                    : (
                                        <AsyncStatusProvider>
                                            <FilesBrowser
                                                publicBucketData={publicBucketDataRef.current}
                                                onSelect={handleOnSelect}
                                                onUpload={handleOnUpload}
                                            />
                                        </AsyncStatusProvider>
                                    )
                                }
                            </TabsContent>
                            <TabsContent value="external">
                                <ExternalImagePreview onSelect={handleOnSelect} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </PublicFilesBrowserContext.Provider>
    );
}

export const usePublicFilesBrowser = () => {
    const context = useContext(PublicFilesBrowserContext);
    if (!context) {
        throw new Error('usePublicFilesBrowser must be used within a PublicFilesBrowserProvider');
    }
    return context;
};
