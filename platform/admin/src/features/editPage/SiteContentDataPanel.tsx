import React, {useState, useMemo, useRef} from 'react';
import get from 'lodash-es/get';
import set from 'lodash-es/set';
import cloneDeep from 'lodash-es/cloneDeep';
import {
    LucideSettings,
    LucideMinus,
    LucidePlus,
    LucideChevronDown, LucideCopy
} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {useSessionState} from '@/utils/localStorage';
import {
    ContentDataConfigClass,
    ContentDataBlockClass,
    ContentDataFieldClass
} from 'infra-common/data/ContentDataConfig';
import {Label} from '@/components/ui/label';
import {
    ContentData,
    ContentDataBlock,
    ContentDataField
} from 'infra-common/data/ContentData';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {ScrollArea} from '@/components/ui/scroll-area';
import {CodeEditorJson} from '@/components/utils/CodeEditorJson';
import {buildOrUpdateContentObject, isContentDataBlockEmpty} from '@/utils/PageUtils';
import {IndexPositionBadge} from '@/components/utils/IndexPositionBadge';
import {arrayMove} from '@/utils/arrayUtils';
import {ControlString} from '@/features/editPage/ControlString';
import {ControlImage} from '@/features/editPage/ControlImage';
import {ControlTipTap} from '@/features/editPage/ControlTipTap';
import {cn} from '@/utils/ComponentsUtils';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';
import {DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {ControlLink} from '@/features/editPage/ControlLink';
import {PagesData} from '@/data/PagesData';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {ContentDataBlockAddButton} from '@/features/editPage/ContentDataBlockAddButton';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';
import {ControlStringWithVariants} from '@/features/editPage/ControlStringWithVariants';
import {FieldLabel} from './FieldLabel';
import {useHistoryData} from '@/features/editPage/HistoryDataProvider';

interface SiteContentDataPanelProps {
    siteSessionStateKey: string;
    pagesData: PagesData;
    isInAction?: boolean;
    actionData: any;
}

export function SiteContentDataPanel(props: SiteContentDataPanelProps) {
    const {siteSessionStateKey, pagesData, isInAction, actionData} = props;
    const {toggleHelp} = useHelpSheet();
    const {putIntoHistory} = useHistoryData();
    const [isDataConfigMode, setDataConfigMode] = useState<boolean>(false);
    const {
        value: pageContentUniqueKey = 0,
        saveValue: setPageContentUniqueKey
    } = useSessionState<number>('pageContentUniqueKey');
    const {value: siteEntry, saveValue: saveSiteEntry} = useSessionState<DI_SiteEntry>(siteSessionStateKey);
    const {
        value: selectedGroup = 'Default',
        saveValue: saveSelectedGroup
    } = useSessionState<string>('selectedSiteDataGroup');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    if (!siteEntry || !siteEntry.SiteContent) {
        return (
            <div>
                <p>Missing Initial Data For Site Data</p>
            </div>
        );
    }

    const {Entry, SiteContent} = siteEntry;

    const handleSubmitConfig = (code: string) => {
        if (SiteContent && Entry) {
            try {
                putIntoHistory({siteEntry});
                const newContentDataConfigClass = JSON.parse(code);
                const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
                const newContentData: ContentData = buildOrUpdateContentObject(
                    newContentDataConfigClass,
                    prevContentData
                );
                SiteContent.SiteContentData.S = JSON.stringify(newContentData);
                SiteContent.SiteContentDataConfig.S = code;
                Entry.EntryUpdateDate.N = Date.now().toString();
                saveSiteEntry(siteEntry);
                setDataConfigMode(false);
            } catch (e: any) {
                console.error('Error saving the site data config.', e.message);
                // do nothing
            }
        }
    };

    let contentDataConfigClass: ContentDataConfigClass = {};
    let contentData: ContentData = [];
    let contentDataError = '';
    let groups: Array<string> = ['Default'];
    if (SiteContent.SiteContentDataConfig.S) {
        try {
            contentDataConfigClass = JSON.parse(SiteContent.SiteContentDataConfig.S);
            for (const [_, configClass] of Object.entries(contentDataConfigClass)) {
                if (configClass.group && !groups.includes(configClass.group)) {
                    groups.push(configClass.group);
                }
            }
        } catch (e: any) {
            contentDataError = 'Error parsing the content data configuration. Please double check the data config settings.';
        }
    }
    try {
        contentData = JSON.parse(SiteContent.SiteContentData.S);
    } catch (e: any) {
        contentDataError = 'Error parsing the content data values.';
    }

    const selectedBlockClasses: Record<string, ContentDataBlockClass> = useMemo(() => {
        let resultMap: Record<string, ContentDataBlockClass> = {};
        for (const [configClassKey, configClass] of Object.entries(contentDataConfigClass)) {
            if ((selectedGroup === 'Default' && !configClass.group) || (selectedGroup === configClass.group)) {
                resultMap[configClassKey] = configClass;
            }
        }
        return resultMap;
    }, [selectedGroup, contentDataConfigClass]);

    const groupedContentDataIndexOffset: Record<number, number> = {};
    const groupedContentData: ContentData = [];
    let contentDataItemIndex = 0;
    for (const contentDataItem of contentData) {
        if (!!selectedBlockClasses[contentDataItem.key]) {
            groupedContentDataIndexOffset[groupedContentData.length] = contentDataItemIndex;
            groupedContentData.push(contentDataItem);
        }
        contentDataItemIndex++;
    }
    // const groupedContentData: ContentData = contentData.filter(i => {
    //     return !!selectedBlockClasses[i.key];
    // });

    const handleContentDataChange = (newContentData: ContentData, doRefresh?: boolean) => {
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            SiteContent.SiteContentData.S = JSON.stringify(newContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            if (doRefresh) {
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    };

    const handleAddNewBlock = (code: string, groupedBlockIndex: number, increment: number = 0) => {
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            const newIndex = groupedContentDataIndexOffset[groupedBlockIndex] + increment;
            prevContentData.splice(newIndex, 0, {
                key: code,
                fields: {}
            });
            SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const foundBlockTitleElement = document.getElementById(`block_${newIndex}_${code}`);
                    if (foundBlockTitleElement) {
                        scrollAreaRef.current.scrollTo({top: foundBlockTitleElement.offsetTop, behavior: 'smooth'});
                    }
                }
            }, 300);
        }
    };

    const handleCopyBlock = (groupedBlockIndex: number) => {
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            const oldIndex = groupedContentDataIndexOffset[groupedBlockIndex];
            const newBlockContent: ContentDataBlock = cloneDeep(prevContentData[oldIndex]);
            const newIndex = groupedContentDataIndexOffset[groupedBlockIndex] + 1;
            prevContentData.splice(newIndex, 0, newBlockContent);
            SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const foundBlockTitleElement = document.getElementById(`block_${newIndex}_${newBlockContent.key}`);
                    if (foundBlockTitleElement) {
                        scrollAreaRef.current.scrollTo({top: foundBlockTitleElement.offsetTop, behavior: 'smooth'});
                    }
                }
            }, 300);
        }
    };

    const handleRemoveBlock = (groupBlockIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            prevContentData.splice(groupedContentDataIndexOffset[groupBlockIndex], 1);
            SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
        }
    };

    const handleMoveBlock = (groupBlockIndex: number) => (newGroupBlockIndex: number) => {
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            let prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            prevContentData = arrayMove(prevContentData, groupedContentDataIndexOffset[groupBlockIndex], groupedContentDataIndexOffset[newGroupBlockIndex]);
            SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
        }
    };

    const handleAddNewField = (fieldPath: string, fieldIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            const fieldContentData: Array<ContentDataField> = get(prevContentData, fieldPath, []);
            fieldContentData.splice(fieldIndex, 0, {stringValue: ''});
            set(prevContentData, fieldPath, fieldContentData);
            SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
        }
    };

    const handleRemoveField = (fieldPath: string, fieldIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (SiteContent && Entry) {
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            const fieldContentData: Array<ContentDataField> = get(prevContentData, fieldPath, []);
            if (fieldContentData.length > 0) {
                putIntoHistory({siteEntry});
                fieldContentData.splice(fieldIndex, 1);
                set(prevContentData, fieldPath, fieldContentData);
                SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
                Entry.EntryUpdateDate.N = Date.now().toString();
                saveSiteEntry(siteEntry);
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    };

    const handleMoveField = (fieldPath: string, fieldIndex: number) => (newFieldIndex: number) => {
        if (SiteContent && Entry) {
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            let fieldContentData: Array<ContentDataField> = get(prevContentData, fieldPath, []);
            if (fieldContentData.length > 0) {
                putIntoHistory({siteEntry});
                fieldContentData = arrayMove(fieldContentData, fieldIndex, newFieldIndex);
                set(prevContentData, fieldPath, fieldContentData);
                SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
                Entry.EntryUpdateDate.N = Date.now().toString();
                saveSiteEntry(siteEntry);
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    };

    const renderField = (
        fieldClass: ContentDataFieldClass,
        fieldPath: string
    ) => {
        const isFieldArray = !!fieldClass.isArray;
        if (isFieldArray) {
            const fieldsContents: Array<ContentDataField> = get(contentData, fieldPath, []) as Array<ContentDataField>;
            if (fieldsContents.length === 0) {
                return (
                    <div key={`firstField_${fieldClass.key}`}
                         className="flex flex-row gap-2 items-center justify-between pr-2 rounded-[6px] border-[1px] border-transparent border-dashed hover:border-slate-300">
                        <FieldLabel label={fieldClass.label}/>
                        <ButtonAction
                            Icon={LucidePlus}
                            size="xxs"
                            variant="outline"
                            onClick={handleAddNewField(fieldPath, 0)}
                        />
                    </div>
                );
            } else {
                return fieldsContents.map((fieldContent, fieldContentIndex) => {
                    return (
                        <div key={`field_${fieldClass.key}_${fieldContentIndex}`} className="flex flex-col gap-2">
                            <div
                                className="flex flex-row gap-2 items-center justify-between pr-2 rounded-[6px] border-[1px] border-transparent border-dashed hover:border-slate-300">
                                <Label
                                    className="flex flex-row gap-2 items-center text-muted-foreground font-semibold relative"
                                    htmlFor={`${fieldPath}.${fieldContentIndex}`}
                                >
                                    <span
                                        className="absolute -left-[13px] top-[calc(50%-3px)] w-[5px] h-[5px] bg-slate-400 rounded-full"/>
                                    {fieldClass.label}
                                    <IndexPositionBadge
                                        index={fieldContentIndex}
                                        length={fieldsContents.length}
                                        onSelect={handleMoveField(fieldPath, fieldContentIndex)}
                                        label={fieldClass.label}
                                    />
                                </Label>
                                <div className="flex flex-row gap-2 items-center">
                                    <ButtonAction
                                        Icon={LucideMinus}
                                        size="xxs"
                                        variant="outline"
                                        onClick={handleRemoveField(fieldPath, fieldContentIndex)}
                                    />
                                    <ButtonAction
                                        Icon={LucidePlus}
                                        size="xxs"
                                        variant="outline"
                                        onClick={handleAddNewField(fieldPath, fieldContentIndex + 1)}
                                    />
                                </div>
                            </div>
                            <div className="ml-3 flex flex-col gap-2">
                                {fieldClass.type === 'string' && !fieldClass.variants && (
                                    <ControlString
                                        key={`${fieldPath}.${fieldContentIndex}`}
                                        controlKey={pageContentUniqueKey}
                                        contentData={contentData}
                                        fieldPath={`${fieldPath}.${fieldContentIndex}`}
                                        disabled={isInAction}
                                        onChange={handleContentDataChange}
                                    />
                                )}
                                {fieldClass.type === 'string' && !!fieldClass.variants && (
                                    <ControlStringWithVariants
                                        key={`${fieldPath}.${fieldContentIndex}`}
                                        controlKey={pageContentUniqueKey}
                                        contentData={contentData}
                                        fieldClass={fieldClass}
                                        fieldPath={`${fieldPath}.${fieldContentIndex}`}
                                        disabled={isInAction}
                                        onChange={handleContentDataChange}
                                    />
                                )}
                                {fieldClass.type === 'image' && (
                                    <ControlImage
                                        key={`${fieldPath}.${fieldContentIndex}`}
                                        controlKey={pageContentUniqueKey}
                                        fieldPath={`${fieldPath}.${fieldContentIndex}`}
                                        contentData={contentData}
                                        disabled={isInAction}
                                        onChange={handleContentDataChange}
                                    />
                                )}
                                {fieldClass.type === 'rich_text' && (
                                    <ControlTipTap
                                        key={`${fieldPath}.${fieldContentIndex}`}
                                        controlKey={pageContentUniqueKey}
                                        fieldPath={`${fieldPath}.${fieldContentIndex}`}
                                        contentData={contentData}
                                        disabled={isInAction}
                                        onChange={handleContentDataChange}
                                    />
                                )}
                                {fieldClass.type === 'page_link' && (
                                    <ControlLink
                                        key={`${fieldPath}.${fieldContentIndex}`}
                                        controlKey={pageContentUniqueKey}
                                        fieldPath={`${fieldPath}.${fieldContentIndex}`}
                                        contentData={contentData}
                                        pagesData={pagesData}
                                        disabled={isInAction}
                                        onChange={handleContentDataChange}
                                    />
                                )}
                                <ActionDataFieldError
                                    actionData={actionData}
                                    fieldName={fieldPath}
                                />
                            </div>
                        </div>
                    );
                });
            }
        } else {
            return (
                <div key={`field_${fieldClass.key}`} className="flex flex-col gap-2">
                    <FieldLabel label={fieldClass.label} field={fieldPath}/>
                    <div className="ml-3 flex flex-col gap-2">
                        {fieldClass.type === 'string' && !fieldClass.variants && (
                            <ControlString
                                key={fieldPath}
                                controlKey={pageContentUniqueKey}
                                contentData={contentData}
                                fieldPath={fieldPath}
                                disabled={isInAction}
                                onChange={handleContentDataChange}
                            />
                        )}
                        {fieldClass.type === 'string' && !!fieldClass.variants && (
                            <ControlStringWithVariants
                                key={fieldPath}
                                controlKey={pageContentUniqueKey}
                                contentData={contentData}
                                fieldClass={fieldClass}
                                fieldPath={fieldPath}
                                disabled={isInAction}
                                onChange={handleContentDataChange}
                            />
                        )}
                        {fieldClass.type === 'image' && (
                            <ControlImage
                                key={fieldPath}
                                controlKey={pageContentUniqueKey}
                                contentData={contentData}
                                fieldPath={fieldPath}
                                disabled={isInAction}
                                onChange={handleContentDataChange}
                            />
                        )}
                        {fieldClass.type === 'rich_text' && (
                            <ControlTipTap
                                key={fieldPath}
                                controlKey={pageContentUniqueKey}
                                contentData={contentData}
                                fieldPath={fieldPath}
                                disabled={isInAction}
                                onChange={handleContentDataChange}
                            />
                        )}
                        {fieldClass.type === 'page_link' && (
                            <ControlLink
                                key={fieldPath}
                                controlKey={pageContentUniqueKey}
                                contentData={contentData}
                                fieldPath={fieldPath}
                                pagesData={pagesData}
                                disabled={isInAction}
                                onChange={handleContentDataChange}
                            />
                        )}
                        <ActionDataFieldError
                            actionData={actionData}
                            fieldName={fieldPath}
                        />
                    </div>
                </div>
            );
        }
    };

    return (
        <Card className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden">
            {isDataConfigMode
                ? (
                    <div className="flex-grow h-full w-full">
                        <CodeEditorJson
                            stateKey="siteJson"
                            readOnly={isInAction}
                            code={SiteContent.SiteContentDataConfig.S || ''}
                            onHelp={toggleHelp}
                            onSubmit={handleSubmitConfig}
                            onCancel={() => setDataConfigMode(false)}
                        />
                    </div>
                )
                : (
                    <div className="h-full w-full flex flex-col">
                        <CardContent className="flex flex-row justify-between gap-2 pt-4">
                            <div className="flex flex-row items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            disabled={isInAction || groups.length <= 1}
                                            className="justify-start"
                                        >
                                            {selectedGroup}
                                            <LucideChevronDown className="w-4 h-4 ml-2"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {groups.map((groupItem, groupIdx) => {
                                            return (
                                                <DropdownMenuItem
                                                    key={groupItem}
                                                    onSelect={() => saveSelectedGroup(groupItem)}
                                                >
                                                    <div>{groupItem}</div>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div>
                                    <p className="text-muted-foreground text-sm">blocks group</p>
                                </div>
                            </div>
                            <div className="flex flex-row items-center gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <ButtonAction
                                            Icon={LucidePlus}
                                            size="sm"
                                            label="Add Block"
                                            disabled={Object.entries(selectedBlockClasses).length === 0}
                                            variant="outline"
                                        />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent collisionPadding={{top: 10, right: 10}}>
                                        {Object.entries(selectedBlockClasses).map((entry) => {
                                            return (
                                                <DropdownMenuItem
                                                    key={entry[0]}
                                                    onSelect={() => handleAddNewBlock(entry[0], 0)}
                                                >
                                                    <div>Add {entry[1].label}</div>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <TooltipWrapper delayDuration={700}
                                                text="Modify the configuration of the data fields.">
                                    <ButtonAction
                                        size="sm"
                                        variant="ghost"
                                        Icon={LucideSettings}
                                        onClick={() => setDataConfigMode(true)}
                                    />
                                </TooltipWrapper>
                            </div>
                        </CardContent>
                        <div className="flex-grow relative h-full">
                            <div className="absolute inset-0">
                                <ScrollArea viewportRef={scrollAreaRef} className="grow h-full w-full">
                                    <CardContent className="h-full flex flex-col gap-2 relative">
                                        <div className="h-full w-full flex flex-col gap-4">
                                            {contentDataError && (
                                                <div>
                                                    <p className="text-xs text-red-600">{contentDataError}</p>
                                                </div>
                                            )}
                                            {groupedContentData.length === 0
                                                ? (
                                                    <div
                                                        className="flex flex-row gap-2 items-center justify-between px-2 py-1 border-[1px] border-dashed border-slate-100 rounded-[6px]">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground font-medium">No
                                                                Blocks</p>
                                                        </div>
                                                        {/*<TooltipWrapper text="Add new block">*/}
                                                        <ContentDataBlockAddButton
                                                            blockRecords={selectedBlockClasses}
                                                            onSelect={(blockKey => handleAddNewBlock(blockKey, 0))}
                                                        />
                                                        {/*</TooltipWrapper>*/}
                                                    </div>
                                                )
                                                : groupedContentData.map((contentDataBlock: ContentDataBlock, blockIndex) => {
                                                    const foundBlockClass = selectedBlockClasses[contentDataBlock.key];
                                                    const isBlockEmpty = isContentDataBlockEmpty(contentDataBlock);
                                                    if (foundBlockClass) {
                                                        return (
                                                            <div
                                                                id={`block_${groupedContentDataIndexOffset[blockIndex]}_${contentDataBlock.key}`}
                                                                key={`block_${groupedContentDataIndexOffset[blockIndex]}_${contentDataBlock.key}`}
                                                                className="flex flex-col gap-4"
                                                            >
                                                                <div
                                                                    className={cn("flex flex-row gap-4 items-center justify-between px-2 py-1 rounded-[6px] border-[1px] border-transparent", {
                                                                        'bg-slate-100': !isBlockEmpty,
                                                                        'bg-orange-100': isBlockEmpty
                                                                    })}
                                                                >
                                                                    <div
                                                                        className="flex flex-row gap-2 items-center justify-center flex-grow">
                                                                        <IndexPositionBadge
                                                                            index={blockIndex}
                                                                            length={groupedContentData.length}
                                                                            onSelect={handleMoveBlock(blockIndex)}
                                                                            label={foundBlockClass.label}
                                                                        />
                                                                        <p className="text-sm text-muted-foreground font-medium">{foundBlockClass.label}</p>
                                                                    </div>
                                                                    <div className="flex flex-row gap-2 items-center">
                                                                        <ButtonAction
                                                                            Icon={LucideMinus}
                                                                            size="xxs"
                                                                            variant="outline"
                                                                            onClick={handleRemoveBlock(blockIndex)}
                                                                        />
                                                                        <ButtonAction
                                                                            Icon={LucideCopy}
                                                                            size="xxs"
                                                                            variant="outline"
                                                                            onClick={() => handleCopyBlock(blockIndex)}
                                                                        />
                                                                        <div className="flex flex-row items-center">
                                                                            <ContentDataBlockAddButton
                                                                                blockRecords={selectedBlockClasses}
                                                                                onSelect={(blockKey => handleAddNewBlock(blockKey, blockIndex, 1))}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="pl-6 flex flex-col gap-6">
                                                                    {foundBlockClass.fields.map((fieldClass: ContentDataFieldClass) => {
                                                                        const fieldPath = `${groupedContentDataIndexOffset[blockIndex]}.fields.${fieldClass.key}`;
                                                                        return renderField(fieldClass, fieldPath);
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                        </div>
                                    </CardContent>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                )
            }
        </Card>
    );
}
