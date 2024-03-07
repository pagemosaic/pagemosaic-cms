import React, {useState} from 'react';
import {LucidePlusCircle, LucideCheck, LucideFilePlus2} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {Switch} from '@/components/ui/switch';
import {DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {getIdFromPK} from 'infra-common/utility/database';

interface CreateNewPageButtonProps {
    currentPath?: string;
    templateEntries: Array<DI_TemplateEntry>;
}

export function FormBody({isInAction, actionData, templateEntries}: {
    isInAction: boolean;
    actionData: any;
    templateEntries: Array<DI_TemplateEntry>;
}) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
    const [inSubDirectory, setInSubDirectory] = useState<boolean>(false);
    const [withNewTemplate, setWithNewTemplate] = useState<boolean>(false);
    const handleSelectTemplate = (value: string) => {
        setSelectedTemplateId(value);
    };
    const handleCheckInSubDirectory = (checked: boolean) => {
        setInSubDirectory(checked);
    };
    const handleCheckWithNewTemplate = (checked: boolean) => {
        setWithNewTemplate(checked);
    };
    return (
        <div className="grid flex-1 gap-5">
            <div className="flex flex-col gap-2">
                <div>
                    <Label htmlFor="templateId">Page Template:</Label>
                </div>
                <div className="w-full">
                    <Select
                        name="templateId"
                        onValueChange={handleSelectTemplate}
                        value={selectedTemplateId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Template ..." />
                        </SelectTrigger>
                        <SelectContent>
                            {templateEntries.map((templateItem) => {
                                return (
                                    <SelectItem key={templateItem.Entry?.PK.S} value={getIdFromPK(templateItem.Entry?.PK.S)}>
                                        {templateItem.Meta?.TemplateTitle.S}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
                <ActionDataFieldError actionData={actionData} fieldName="templateId"/>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Switch
                        id="in-new-directory"
                        defaultChecked={inSubDirectory}
                        onCheckedChange={handleCheckInSubDirectory}
                        name="inSubDirectory"
                        value="true"
                    />
                    <Label htmlFor="in-new-directory">In a Sub Route</Label>
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
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Switch
                        id="with-new-template"
                        name="withNewTemplate"
                        defaultChecked={withNewTemplate}
                        onCheckedChange={handleCheckWithNewTemplate}
                        value="true"
                    />
                    <Label htmlFor="with-new-template">With a New Template</Label>
                </div>
                {withNewTemplate && (
                    <div className="flex flex-col gap-2">
                        <Input
                            id="newTemplateTitle"
                            name="newTemplateTitle"
                            defaultValue={templateEntries.find(i => getIdFromPK(i.Entry?.PK.S) === selectedTemplateId)?.Meta?.TemplateTitle.S || ''}
                            disabled={isInAction || !withNewTemplate}
                            placeholder="New Template Name"
                        />
                        <ActionDataFieldError actionData={actionData} fieldName="newTemplateTitle"/>
                        <div>
                            <p className="text-muted-foreground text-sm">
                                Make a duplicate of the current template for a new page. With the new template, you can
                                design the page differently.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function CreateNewPageButton(props: CreateNewPageButtonProps) {
    const {templateEntries, currentPath} = props;
    const {showDialog} = useActionForm();

    return (
        <ButtonAction
            Icon={LucideFilePlus2}
            label="Create New Page"
            size="default"
            variant="outline"
            onClick={() => {
                showDialog({
                    action: 'createPage',
                    formDataParams: {
                        currentPath: currentPath || ''
                    },
                    buttonLabel: 'Create',
                    Icon: LucideCheck,
                    title: 'New Page',
                    // description: '',
                    render: ({actionData, isInAction}) => {
                        return (
                            <FormBody
                                isInAction={isInAction}
                                actionData={actionData}
                                templateEntries={templateEntries}
                            />
                        );
                    }
                });
            }}
        />
    );
}
