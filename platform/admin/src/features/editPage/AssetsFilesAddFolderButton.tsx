import React, {useState, useRef, useEffect} from 'react';
import {LucideFolderPlus, LucideX, LucideCheck} from 'lucide-react';
import {TreeNode} from 'infra-common/system/Bucket';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {useAsyncStatus} from '@/components/utils/AsyncStatusProvider';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {publicBucketDataSingleton} from '@/data/PublicBucketData';

interface AssetsFilesAddFolderButtonProps {
    node: TreeNode;
    onSuccess: () => void;
}

export function AssetsFilesAddFolderButton(props: AssetsFilesAddFolderButtonProps) {
    const {node, onSuccess} = props;
    const [open, setOpen] = useState<boolean>(false);
    const [inputError, setInputError] = useState<string>('');
    const {status, setStatus} = useAsyncStatus();
    const folderInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setInputError('');
        }
    }, [open]);

    const addFolder = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (folderInputRef.current && node.path) {
            const directoryName = folderInputRef.current.value;
            if (!directoryName || directoryName.length === 0) {
                setInputError('The folder name should be not empty.')
            } else {
                setStatus({isLoading: true});
                publicBucketDataSingleton.addFolder(`${node.path}${directoryName}`)
                    .then(() => {
                        setStatus({isSuccess: true});
                        setOpen(false);
                        setInputError('');
                        onSuccess();
                    })
                    .catch((e: any) => {
                        setStatus({isError: true, error: e.message});
                    });
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild={true}>
                <ButtonAction
                    Icon={LucideFolderPlus}
                    disabled={status.isLoading}
                    type="button"
                    size="sm"
                    variant="ghost"
                    label="Add Folder"
                />
            </DialogTrigger>
            <DialogContent className="max-w-md bg-slate-50">
                <DialogHeader>
                    <DialogTitle>New Folder</DialogTitle>
                    <DialogDescription>
                        A folder will be created in the current directory.
                    </DialogDescription>
                    {status.isError && (
                        <div>
                            <p className="text-xs text-red-600">{status.error}</p>
                        </div>
                    )}
                </DialogHeader>
                <form onSubmit={addFolder}>
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Folder Name
                        </Label>
                        <Input
                            ref={folderInputRef}
                            id="directoryName"
                            name="directoryName"
                            defaultValue=""
                            disabled={status.isLoading}
                        />
                        {inputError && (
                            <div>
                                <p className="text-xs text-red-600">{inputError}</p>
                            </div>
                        )}
                    </div>
                </form>
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
                        Icon={LucideCheck}
                        isLoading={status.isUninitialized || status.isLoading}
                        disabled={status.isError}
                        type="submit"
                        size="sm"
                        variant="default"
                        label="Create"
                        onClick={addFolder}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
