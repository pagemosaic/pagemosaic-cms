import React, {useRef} from 'react';
import {LucideCheck, LucidePencil} from 'lucide-react';
import slugify from 'slugify';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';
import {DI_PageMetaSlice} from 'infra-common/data/DocumentItem';
import {Checkbox} from '@/components/ui/checkbox';

interface EditPageMetaButtonProps {
    pageId: string;
    templateId: string;
    meta: DI_PageMetaSlice;
}

interface PageMetaFormProps {
    isInAction: boolean;
    actionData: any;
    meta: DI_PageMetaSlice;
}

function PageMetaForm(props: PageMetaFormProps) {
    const {isInAction, actionData, meta} = props;
    const inputTitleRef = useRef<HTMLInputElement>(null);
    const inputSlugRef = useRef<HTMLInputElement>(null);

    const handleGenerateNewSlug = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (inputSlugRef.current && inputTitleRef.current) {
            inputSlugRef.current.value = slugify(inputTitleRef.current.value || '', {lower: true});
        }
    };

    const {PageTitle, PageSlug, ExcludeFromSitemap} = meta;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid flex-1 gap-2">
                <Label htmlFor="PageTitle">
                    Page Title
                </Label>
                <Input
                    ref={inputTitleRef}
                    id="PageTitle"
                    name="PageTitle"
                    defaultValue={PageTitle.S || ''}
                    disabled={isInAction}
                />
                <ActionDataFieldError actionData={actionData} fieldName="PageTitle"/>
            </div>
            <div className="grid flex-1 gap-2">
                <Label htmlFor="PageSlug">
                    Page Slug
                </Label>
                <div className="w-full flex flex-row gap-2 items-center">
                    <div className="flex-grow">
                        <Input
                            ref={inputSlugRef}
                            id="PageSlug"
                            name="PageSlug"
                            type="text"
                            disabled={isInAction}
                            defaultValue={PageSlug.S || ''}
                        />
                    </div>
                    <div>
                        <ButtonAction
                            label="Generate"
                            variant="secondary"
                            size="sm"
                            onClick={handleGenerateNewSlug}
                        />
                    </div>
                </div>
                <ActionDataFieldError actionData={actionData} fieldName="PageSlug"/>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <Checkbox
                    id="ExcludeFromSitemap"
                    name="ExcludeFromSitemap"
                    defaultChecked={ExcludeFromSitemap?.S === 'true'}
                    value="true"
                />
                <Label htmlFor="ExcludeFromSitemap">
                    Exclude this page from the sitemap
                </Label>
            </div>
        </div>
    );
}

export function EditPageMetaButton(props: EditPageMetaButtonProps) {
    const {pageId, templateId, meta} = props;
    const {showDialog} = useActionForm();

    return (
        <TooltipWrapper text="Edit page title and slug">
            <ButtonAction
                Icon={LucidePencil}
                size="sm"
                variant="outline"
                label="Edit Title"
                onClick={() => {
                    showDialog({
                        action: 'updatePageMeta',
                        contentClassName: 'max-w-[700px]',
                        formDataParams: {
                            pageId,
                            templateId
                        },
                        buttonLabel: 'Submit',
                        Icon: LucideCheck,
                        title: 'Edit Page Identification',
                        render: ({actionData, isInAction}) => {
                            return (
                                <PageMetaForm isInAction={isInAction} actionData={actionData} meta={meta}/>
                            );
                        }
                    });
                }}
            />
        </TooltipWrapper>
    );
}
