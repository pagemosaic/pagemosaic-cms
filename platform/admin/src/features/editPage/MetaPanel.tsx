import React from 'react';
import debounce from 'lodash-es/debounce';
import slugify from 'slugify';
import {DI_PageMetaSlice, DI_PageEntry} from 'infra-common/data/DocumentItem';
import {Card, CardContent} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {ScrollArea} from '@/components/ui/scroll-area';
import {useSessionState} from '@/utils/localStorage';
import {Checkbox} from '@/components/ui/checkbox';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {FieldLabel} from './FieldLabel';

interface MetaPanelProps {
    pageSessionStateKey: string;
    isInAction?: boolean;
    actionData: any;
}

export function MetaPanel(props: MetaPanelProps) {
    const {pageSessionStateKey, isInAction, actionData} = props;
    const {value: pageContentUniqueKey = 0, saveValue: setPageContentUniqueKey} = useSessionState<number>('pageContentUniqueKey');

    const {value: pageEntry, saveValue: setPageEntry} = useSessionState<DI_PageEntry>(pageSessionStateKey);

    if (!pageEntry || !pageEntry.Meta) {
        return (
            <div>
                <p>Missing Initial Data</p>
            </div>
        );
    }

    const {Meta, Entry} = pageEntry;

    const debouncedOnChange = debounce((field: keyof DI_PageMetaSlice, newValue: string, doRefresh: boolean = false) => {
        if (Meta && Entry) {
            Meta[field] = {S: newValue};
            Entry.EntryUpdateDate.N = Date.now().toString();
            setPageEntry(pageEntry);
            if (doRefresh) {
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    }, 800);

    const handleChange = (field: keyof DI_PageMetaSlice) => (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedOnChange(field, e.currentTarget.value);
    };

    const handleChangeValue = (field: keyof DI_PageMetaSlice, doRefresh: boolean = false) => (newValue: string) => {
        if (Meta && Entry) {
            Meta[field] = {S: newValue};
            Entry.EntryUpdateDate.N = Date.now().toString();
            setPageEntry(pageEntry);
            if (doRefresh) {
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    };

    return (
        <Card className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden pt-6 pb-6">
            <ScrollArea className="h-full w-full">
                <CardContent className="h-full">
                    <div className="flex flex-col gap-4">
                        <div className="px-2 py-1 bg-slate-100 rounded-[6px]">
                            <p className="text-sm text-center text-muted-foreground font-medium">Page Identification</p>
                        </div>
                        <div className="flex flex-col gap-6 pl-6">
                            <div className="flex flex-col gap-3">
                                <FieldLabel label="Page Title" field="PageTitle"/>
                                <Input
                                    key={pageContentUniqueKey}
                                    name="PageTitle"
                                    type="text"
                                    autoFocus={true}
                                    disabled={isInAction}
                                    defaultValue={Meta?.PageTitle.S || ''}
                                    onChange={handleChange('PageTitle')}
                                />
                                <ActionDataFieldError actionData={actionData}
                                                      fieldName="PageTitle"/>
                            </div>
                            <div className="flex flex-col gap-3">
                                <FieldLabel label="Slug" field="PageSlug"/>
                                <div className="w-full flex flex-row gap-2 items-center">
                                    <div className="flex-grow">
                                        <Input
                                            key={pageContentUniqueKey}
                                            name="PageSlug"
                                            type="text"
                                            disabled={isInAction}
                                            defaultValue={Meta?.PageSlug.S || ''}
                                            onChange={handleChange('PageSlug')}
                                        />
                                    </div>
                                    <div>
                                        <ButtonAction
                                            label="Generate"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                handleChangeValue('PageSlug', true)(slugify(Meta?.PageTitle.S || '', {lower: true}));
                                            }}
                                        />
                                    </div>
                                </div>
                                <ActionDataFieldError actionData={actionData}
                                                      fieldName="PageSlug"/>
                            </div>
                        </div>
                        <div className="px-2 py-1 bg-slate-100 rounded-[6px]">
                            <p className="text-sm text-center text-muted-foreground font-medium">Generator Settings</p>
                        </div>
                        <div className="flex flex-col gap-6 pl-6">
                            <div className="flex flex-col items-start gap-3 relative">
                                <span
                                    className="absolute -left-[13px] top-[0.25em] w-[5px] h-[5px] bg-slate-400 rounded-full"/>
                                <Label
                                    htmlFor="ExcludeFromSitemap"
                                    className="text-muted-foreground font-semibold"
                                >
                                    Exclude this page from the sitemap
                                </Label>
                                <Checkbox
                                    key={pageContentUniqueKey}
                                    id="ExcludeFromSitemap"
                                    defaultChecked={Meta?.ExcludeFromSitemap?.S === 'true'}
                                    onCheckedChange={(checked) => {
                                        handleChangeValue('ExcludeFromSitemap')(checked ? 'true' : 'false');
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </ScrollArea>
        </Card>
    );
}
