import React, {useState} from 'react';
import {
    LucideMoreVertical,
    LucideCopy,
    LucideTrash2, LucideCheck,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {Label} from '@/components/ui/label';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {Switch} from '@/components/ui/switch';
import {Input} from '@/components/ui/input';
import {ButtonAction} from '@/components/utils/ButtonAction';

export function FormBody({isInAction, actionData}: {
    isInAction: boolean;
    actionData: any;
}) {
    const [inSubDirectory, setInSubDirectory] = useState<boolean>(false);
    const handleCheckInSubDirectory = (checked: boolean) => {
        setInSubDirectory(checked);
    };
    return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Switch
                        id="in-new-directory"
                        defaultChecked={inSubDirectory}
                        onCheckedChange={handleCheckInSubDirectory}
                        name="inSubDirectory"
                        value="true"
                    />
                    <Label htmlFor="in-new-directory">In a sub route</Label>
                </div>
                {inSubDirectory && (
                    <div className="flex flex-col gap-2">
                        <Input
                            id="subDirectory"
                            name="subDirectory"
                            defaultValue=""
                            disabled={isInAction || !inSubDirectory}
                            placeholder="Sub Route"
                        />
                        <ActionDataFieldError actionData={actionData} fieldName="subDirectory"/>
                        <div>
                            <p className="text-muted-foreground text-sm">
                                Create a new page in the sub route. If one doesn't exist, it will be created
                                automatically.
                            </p>
                        </div>
                    </div>
                )}
            </div>
    );
}

interface PageDropdownMenuProps {
    pageId: string;
    templateId: string;
    currentPath: string;
}

export function PageDropdownMenu(props: PageDropdownMenuProps) {
    const {pageId, templateId, currentPath} = props;
    const {showDialog, isInAction} = useActionForm();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={isInAction}
                    className="w-full justify-start"
                >
                    <LucideMoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent collisionPadding={{top: 10, right: 10}} className="w-56">
                <DropdownMenuItem
                    onSelect={() => {
                        showDialog({
                            title: 'Make Page\'s Copy',
                            description: 'When you copy the page, it doesn\'t create a copy of the template. Instead, it lets you add new content while keeping the same design.',
                            action: 'makeCopy',
                            Icon: LucideCheck,
                            buttonLabel: 'Submit',
                            formDataParams: {
                                pageId,
                                templateId,
                                currentPath
                            },
                            dialogType: 'confirm',
                            render: ({actionData, isInAction}) => {
                                return (
                                    <FormBody isInAction={isInAction} actionData={actionData} />
                                )
                            }
                        });
                    }}
                >
                    <LucideCopy className="h-4 w-4 mr-2"/>
                    <div>Make Page's Copy</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem
                    onSelect={() => {
                        showDialog({
                            title: 'Are you sure you want to delete the page?',
                            description: 'This action cannot be undone.',
                            action: 'deletePage',
                            formDataParams: {
                                pageId,
                                templateId
                            }
                        });
                    }}
                >
                    <LucideTrash2 className="h-4 w-4 mr-2"/>
                    <div>Delete</div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function CopyPageButton(props: PageDropdownMenuProps) {
    const {pageId, templateId, currentPath} = props;
    const {showDialog, isInAction} = useActionForm();
    return (
        <ButtonAction
            Icon={LucideCopy}
            size="sm"
            variant="ghost"
            disabled={isInAction}
            onClick={() => {
                showDialog({
                    title: 'Make Page\'s Copy',
                    description: 'When you copy the page, it doesn\'t create a copy of the template. Instead, it lets you add new content while keeping the same design.',
                    action: 'makeCopy',
                    Icon: LucideCheck,
                    buttonLabel: 'Submit',
                    formDataParams: {
                        pageId,
                        templateId,
                        currentPath
                    },
                    dialogType: 'confirm',
                    render: ({actionData, isInAction}) => {
                        return (
                            <FormBody isInAction={isInAction} actionData={actionData} />
                        )
                    }
                });
            }}
        />
    );
}