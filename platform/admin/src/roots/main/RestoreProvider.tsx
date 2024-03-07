import React, {useState, useContext, useEffect} from 'react';
import {LucideUploadCloud, LucideX, LucideRotateCcw} from 'lucide-react';
import {AsyncStatus} from '@/components/utils/AsyncStatusProvider';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {restoreDataSingleton} from '@/data/RestoreData';
import {clearSessionState} from '@/utils/localStorage';

type DialogOptions = {};

interface RestoreProviderProps {
    children: React.ReactNode;
}

export const RestoreContext = React.createContext<{
    showDialog: (options: DialogOptions) => void;
} | null>(null);

export function RestoreProvider(props: RestoreProviderProps) {
    const {children} = props;
    const [dialogOptions, setDialogOptions] = useState<DialogOptions>();
    const [open, setOpen] = useState<boolean>(false);
    const [status, setStatus] = useState<AsyncStatus>({isUninitialized: true});
    const hiddenFileInput = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setStatus({isUninitialized: true});
        }
    }, [open]);

    const showDialog = (options: DialogOptions): void => {
        setDialogOptions(options);
        setOpen(true);
    };

    const handleUploadChange = (e: any) => {
        const files = e.target.files;
        if (!files.length) {
            return;
        }
        setStatus({
            isLoading: true
        });
        restoreDataSingleton.restoreData(files[0]).then(() => {
            setStatus({isSuccess: true});
            setOpen(false);
            clearSessionState();
            window.location.href = '/admin';
        }).catch((e: any) => {
            setStatus({isError: true, error: e.message});
        });
    };

    const handleUploadClick = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <RestoreContext.Provider value={{showDialog}}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl bg-slate-50">
                    <DialogHeader>
                        <DialogTitle>Install New Website</DialogTitle>
                        {status.isError && (
                            <div>
                                <p className="text-xs text-red-600">{status.error}</p>
                            </div>
                        )}
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        {status.isLoading
                            ? (
                                <div className="flex flex-row items-center gap-2">
                                    <p className="text-sm">Installing the new website. Please wait for the process to complete...</p>
                                </div>
                            )
                            : (
                                <div>
                                    <p className="text-sm">
                                        All data will be erased. Are you sure you want to proceed?
                                    </p>
                                </div>
                            )
                        }
                    </div>
                    <DialogFooter>
                        <ButtonAction
                            onClick={handleClose}
                            label="Cancel"
                            Icon={LucideX}
                            disabled={status.isLoading}
                            variant="ghost"
                        />
                        <div>
                            <input
                                ref={hiddenFileInput}
                                style={{display: 'none'}}
                                type="file"
                                accept="application/zip"
                                multiple={false}
                                onChange={handleUploadChange}
                                onPaste={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <ButtonAction
                                variant="default"
                                size="default"
                                label="Upload Package"
                                Icon={LucideUploadCloud}
                                isLoading={status.isLoading}
                                onClick={handleUploadClick}
                            />
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </RestoreContext.Provider>
    );
}

export const useRestore = () => {
    const context = useContext(RestoreContext);
    if (!context) {
        throw new Error('useRestore must be used within a RestoreProvider');
    }
    return context;
};
