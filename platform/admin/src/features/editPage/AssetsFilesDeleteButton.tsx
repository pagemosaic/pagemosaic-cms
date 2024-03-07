import React, {useState} from 'react';
import {LucideTrash2, LucideX} from 'lucide-react';
import {useAsyncStatus} from '@/components/utils/AsyncStatusProvider';
import {publicBucketDataSingleton} from '@/data/PublicBucketData';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {ButtonAction} from '@/components/utils/ButtonAction';

interface AssetsFilesDeleteButtonProps {
    filePaths: Array<string>;
    onSuccess: () => void;
}

export function AssetsFilesDeleteButton(props: AssetsFilesDeleteButtonProps) {
    const {filePaths, onSuccess} = props;
    const [open, setOpen] = useState<boolean>(false);
    const {status, setStatus} = useAsyncStatus();

    const deleteFiles = () => {
        setStatus({isLoading: true});
        publicBucketDataSingleton.deleteFiles(filePaths)
            .then(() => {
                setStatus({isSuccess: true});
                setOpen(false);
                onSuccess();
            })
            .catch((e: any) => {
                setStatus({isError: true, error: e.message});
            });
    };

    return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild={true}>
                    <ButtonAction
                        Icon={LucideTrash2}
                        disabled={status.isLoading || filePaths.length === 0}
                        type="button"
                        size="sm"
                        variant="ghost"
                        label="Delete"
                    />
                </DialogTrigger>
                <DialogContent className="max-w-md bg-slate-50">
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to delete the selected files?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone.
                        </DialogDescription>
                        {status.isError && (
                            <div>
                                <p className="text-xs text-red-600">{status.error}</p>
                            </div>
                        )}
                    </DialogHeader>
                    <DialogFooter>
                        <ButtonAction
                            Icon={LucideX}
                            disabled={status.isLoading}
                            type="button"
                            size="sm"
                            variant="ghost"
                            label="Cancel"
                            onClick={() => setOpen(false)}
                        />
                        <ButtonAction
                            Icon={LucideTrash2}
                            isLoading={status.isUninitialized || status.isLoading}
                            disabled={status.isError}
                            type="button"
                            size="sm"
                            variant="default"
                            label={`Delete Selected ${filePaths.length} ${filePaths.length > 1 ? 'Items' : 'Item'}`}
                            onClick={deleteFiles}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
    );
}
