import React from 'react';
import {LucideCheck, LucidePencil} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';

interface EditTemplateTitleButtonProps {
    templateId: string;
    oldTitle: string;
}

export function EditTemplateTitleButton(props: EditTemplateTitleButtonProps) {
    const {templateId, oldTitle} = props;
    const {showDialog} = useActionForm();

    return (
        <TooltipWrapper text="Edit template name">
            <ButtonAction
                Icon={LucidePencil}
                size="xxs"
                variant="ghost"
                onClick={() => {
                    showDialog({
                        action: 'updateTemplateTitle',
                        formDataParams: {
                            templateId
                        },
                        buttonLabel: 'Submit',
                        Icon: LucideCheck,
                        title: 'Edit Template Name',
                        render: ({actionData, isInAction}) => {
                            return (
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">
                                        New Template Name
                                    </Label>
                                    <Input
                                        id="newTitle"
                                        name="newTitle"
                                        defaultValue={oldTitle}
                                        disabled={isInAction}
                                    />
                                    <ActionDataFieldError actionData={actionData} fieldName="newTitle"/>
                                </div>
                            );
                        }
                    });
                }}
            />
        </TooltipWrapper>
    );
}
