import React from 'react';
import {LucideFolderPlus} from 'lucide-react';
import {TreeNode} from 'infra-common/system/Bucket';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {useActionForm} from '@/components/utils/ActionFormProvider';

interface AddFolderButtonProps {
    node: TreeNode;
}

export function AddFolderButton(props: AddFolderButtonProps) {
    const {node} = props;
    const {showDialog} = useActionForm();

    return (
        <ButtonAction
            Icon={LucideFolderPlus}
            label="Add Folder"
            size="sm"
            variant="outline"
            onClick={() => {
                showDialog({
                    action: 'addFolder',
                    formDataParams: {
                        currentPath: node.path
                    },
                    buttonLabel: 'Add',
                    Icon: LucideFolderPlus,
                    title: 'New Folder',
                    description: 'A folder will be created in the current directory.',
                    render: ({actionData, isInAction}) => {
                        return (
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Folder Name
                                </Label>
                                <Input
                                    id="directoryName"
                                    name="directoryName"
                                    data-autofocus="true"
                                    defaultValue=""
                                    disabled={isInAction}
                                />
                                <ActionDataFieldError actionData={actionData} fieldName="directoryName"/>
                            </div>
                        );
                    }
                });
            }}
        />
    );
}
