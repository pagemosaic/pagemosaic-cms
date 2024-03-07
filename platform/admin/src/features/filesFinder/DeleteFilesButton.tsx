import React from 'react';
import {LucideTrash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useActionForm} from '@/components/utils/ActionFormProvider';

interface DeleteFilesButtonProps {
    filePaths: Array<string>;
}

export function DeleteFilesButton(props: DeleteFilesButtonProps) {
    const {filePaths} = props;
    const {showDialog} = useActionForm();

    return (
        <Button
            size="sm"
            variant="destructive"
            disabled={filePaths.length === 0}
            onClick={() => {
                showDialog({
                    title: 'Are you sure you want to delete the selected files?',
                    description: 'This action cannot be undone.',
                    formDataParams: {
                        filePaths
                    },
                    action: 'deleteFiles'
                });
            }}
        >
            <div className="flex flex-row gap-2 items-center">
                <LucideTrash2 className="w-4 h-4"/>
                <span className="whitespace-nowrap">Delete Selected {`${filePaths.length > 0 ? filePaths.length : ''} ${filePaths.length > 1 ? 'Items' : 'Item'}`}</span>
            </div>
        </Button>
    );
}
