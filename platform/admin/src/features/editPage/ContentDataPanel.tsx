import React, {useState, useMemo, useRef} from 'react';
import get from 'lodash-es/get';
import set from 'lodash-es/set';
import cloneDeep from 'lodash-es/cloneDeep';
import {
    LucideSettings,
    LucideMinus,
    LucidePlus,
    LucideChevronDown,
    LucideAlertTriangle,
    LucideCopy,
    LucideChevronRight
} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {setSessionState, useSessionState} from '@/utils/localStorage';
import {
    ContentDataConfigClass,
    ContentDataBlockClass,
    ContentDataFieldClass
} from 'infra-common/data/ContentDataConfig';
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
import {DI_PageEntry, DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {ControlLink} from '@/features/editPage/ControlLink';
import {PagesData} from '@/data/PagesData';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {getIdFromPK} from 'infra-common/utility/database';
import {ContentDataBlockAddButton} from '@/features/editPage/ContentDataBlockAddButton';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';
import {ControlStringWithVariants} from '@/features/editPage/ControlStringWithVariants';
import {useHistoryData} from '@/features/editPage/HistoryDataProvider';
import {ControlNestedSetSelect} from '@/features/editPage/ControlNestedSetSelect';
import {FieldLabel} from './FieldLabel';

interface ContentDataPanelProps {
    pageSessionStateKey: string;
    templateSessionStateKey: string;
    pagesData: PagesData;
    isInAction?: boolean;
    actionData: any;
}

export function ContentDataPanel(props: ContentDataPanelProps) {
    const {pageSessionStateKey, templateSessionStateKey, pagesData, isInAction, actionData} = props;
    const {toggleHelp} = useHelpSheet();
    const {putIntoHistory} = useHistoryData();
    const [isDataConfigMode, setDataConfigMode] = useState<boolean>(false);
    const {
        value: pageContentUniqueKey = 0,
        saveValue: setPageContentUniqueKey
    } = useSessionState<number>('pageContentUniqueKey');
    const {value: pageEntry} = useSessionState<DI_PageEntry>(pageSessionStateKey);
    const {value: templateEntry} = useSessionState<DI_TemplateEntry>(templateSessionStateKey);
    const {
        value: selectedDataGroups = {},
        saveValue: saveSelectedDataGroups
    } = useSessionState<Record<string, string>>('selectedDataGroups');
    const {
        value: collapsedBlocks = {},
        saveValue: setCollapsedBlocks
    } = useSessionState<Record<string, Record<string, boolean>>>('pageContentCollapsedBlocks');
    const {
        value: collapsedFields = {},
        saveValue: setCollapsedFields
    } = useSessionState<Record<string, Record<string, boolean>>>('pageContentCollapsedFields');

    const scrollAreaRef = useRef<HTMLDivElement>(null);

    if (!pageEntry || !pageEntry.Content || !templateEntry || !templateEntry.Content) {
        return (
            <div>
                <p>Missing Initial Data For Content Data</p>
            </div>
        );
    }

    const {Content, Entry} = pageEntry;
    const {Content: TemplateContent, Entry: TemplateEntry} = templateEntry;

    const handleSubmitConfig = (code: string) => {
        if (Content && Entry && TemplateContent && TemplateEntry) {
            try {
                const newContentDataConfigClass = JSON.parse(code);
                const prevContentData = JSON.parse(Content?.PageContentData.S);
                const newContentData: ContentData = buildOrUpdateContentObject(
                    newContentDataConfigClass,
                    prevContentData
                );
                putIntoHistory({pageEntry, templateEntry});
                Content.PageContentData.S = JSON.stringify(newContentData);
                TemplateContent.PageContentDataConfig.S = code;
                const currentTime = Date.now().toString();
                Entry.EntryUpdateDate.N = currentTime;
                TemplateEntry.EntryUpdateDate.N = currentTime;
                setSessionState(pageSessionStateKey, pageEntry);
                setSessionState(templateSessionStateKey, templateEntry);
                setDataConfigMode(false);
            } catch (e: any) {
                // do nothing
            }
        }
    };

    let contentDataConfigClass: ContentDataConfigClass = {};
    let contentData: ContentData = [];
    let contentDataError = '';
    let groups: Array<string> = ['Default'];
    if (TemplateContent?.PageContentDataConfig.S) {
        try {
            contentDataConfigClass = JSON.parse(TemplateContent?.PageContentDataConfig.S);
            for (const [_, configClass] of Object.entries(contentDataConfigClass)) {
                if (configClass.group && !groups.includes(configClass.group)) {
                    groups.push(configClass.group);
                }
            }
        } catch (e: any) {
            contentDataError = 'Error parsing the content data configuration. Please double check the config settings.';
        }
    }
    try {
        contentData = JSON.parse(Content?.PageContentData.S);
    } catch (e: any) {
        contentDataError = 'Error parsing the content data values.';
    }

    const pageId = getIdFromPK(pageEntry.Entry?.PK.S)
    let selectedGroup = selectedDataGroups[pageId] || 'Default';
    if (selectedGroup !== 'Default' && !groups.includes(selectedGroup)) {
        selectedGroup = 'Default';
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

    const handleToggleBlock = (blockKey: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        let pageCollapsedBlocks = collapsedBlocks[pageId] || {};
        pageCollapsedBlocks[blockKey] = !pageCollapsedBlocks[blockKey];
        setCollapsedBlocks({...collapsedBlocks, [pageId]: pageCollapsedBlocks});
    };

    const handleToggleField = (fieldKey: string) => () => {
        let pageCollapsedFields = collapsedFields[pageId] || {};
        pageCollapsedFields[fieldKey] = !pageCollapsedFields[fieldKey];
        setCollapsedFields({...collapsedFields, [pageId]: pageCollapsedFields});
    };

    const handleContentDataChange = (newContentData: ContentData, doRefresh?: boolean) => {
        if (Content && Entry) {
            putIntoHistory({pageEntry});
            Content.PageContentData.S = JSON.stringify(newContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            setSessionState(pageSessionStateKey, pageEntry);
            if (doRefresh) {
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    };

    const handleAddNewBlock = (code: string, groupedBlockIndex: number, increment: number = 0) => {
        if (Content && Entry) {
            putIntoHistory({pageEntry});
            const prevContentData: ContentData = JSON.parse(Content?.PageContentData.S);
            const newIndex = groupedContentDataIndexOffset[groupedBlockIndex] + increment;
            prevContentData.splice(newIndex, 0, {
                key: code,
                fields: {}
            });
            const newContentData: ContentData = buildOrUpdateContentObject(
                contentDataConfigClass,
                prevContentData
            );
            Content.PageContentData.S = JSON.stringify(newContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            setSessionState(pageSessionStateKey, pageEntry);
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
        if (Content && Entry) {
            putIntoHistory({pageEntry});
            const prevContentData: ContentData = JSON.parse(Content?.PageContentData.S);
            const oldIndex = groupedContentDataIndexOffset[groupedBlockIndex];
            const newBlockContent: ContentDataBlock = cloneDeep(prevContentData[oldIndex]);
            const newIndex = groupedContentDataIndexOffset[groupedBlockIndex] + 1;
            prevContentData.splice(newIndex, 0, newBlockContent);
            Content.PageContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            setSessionState(pageSessionStateKey, pageEntry);
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

    const handleRemoveBlock = (groupedBlockIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (Content && Entry) {
            putIntoHistory({pageEntry});
            const prevContentData: ContentData = JSON.parse(Content?.PageContentData.S);
            prevContentData.splice(groupedContentDataIndexOffset[groupedBlockIndex], 1);
            Content.PageContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            setSessionState(pageSessionStateKey, pageEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
        }
    };

    const handleMoveBlock = (groupedBlockIndex: number) => (newGroupedBlockIndex: number) => {
        if (Content && Entry) {
            putIntoHistory({pageEntry});
            let prevContentData: ContentData = JSON.parse(Content?.PageContentData.S);
            prevContentData = arrayMove(prevContentData, groupedContentDataIndexOffset[groupedBlockIndex], groupedContentDataIndexOffset[newGroupedBlockIndex]);
            Content.PageContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            setSessionState(pageSessionStateKey, pageEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
        }
    };

    const handleAddNewField = (fieldPath: string, fieldIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (Content && Entry) {
            putIntoHistory({pageEntry});
            const prevContentData = JSON.parse(Content?.PageContentData.S);
            const fieldContentData: Array<ContentDataField> = get(prevContentData, fieldPath, []);
            fieldContentData.splice(fieldIndex, 0, {});
            set(prevContentData, fieldPath, fieldContentData);
            const newContentData: ContentData = buildOrUpdateContentObject(
                contentDataConfigClass,
                prevContentData
            );
            Content.PageContentData.S = JSON.stringify(newContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            setSessionState(pageSessionStateKey, pageEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
        }
    };

    const handleRemoveField = (fieldPath: string, fieldIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (Content && Entry) {
            const prevContentData = JSON.parse(Content?.PageContentData.S);
            const fieldContentData: Array<ContentDataField> = get(prevContentData, fieldPath, []);
            if (fieldContentData.length > 0) {
                putIntoHistory({pageEntry});
                fieldContentData.splice(fieldIndex, 1);
                set(prevContentData, fieldPath, fieldContentData);
                Content.PageContentData.S = JSON.stringify(prevContentData);
                Entry.EntryUpdateDate.N = Date.now().toString();
                setSessionState(pageSessionStateKey, pageEntry);
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    };

    const handleMoveField = (fieldPath: string, fieldIndex: number) => (newFieldIndex: number) => {
        if (Content && Entry) {
            const prevContentData = JSON.parse(Content?.PageContentData.S);
            let fieldContentData: Array<ContentDataField> = get(prevContentData, fieldPath, []);
            if (fieldContentData.length > 0) {
                putIntoHistory({pageEntry});
                fieldContentData = arrayMove(fieldContentData, fieldIndex, newFieldIndex);
                set(prevContentData, fieldPath, fieldContentData);
                Content.PageContentData.S = JSON.stringify(prevContentData);
                Entry.EntryUpdateDate.N = Date.now().toString();
                setSessionState(pageSessionStateKey, pageEntry);
                setPageContentUniqueKey(pageContentUniqueKey + 1);
            }
        }
    };

    const renderControl = (
        fieldClass: ContentDataFieldClass,
        fieldPath: string,
    ) => {
        const isCompositeControl = fieldClass.type === 'composite' && fieldClass.nested;
        const isWithNestedSets = fieldClass.nestedSets && fieldClass.nestedSets.length;
        let nestedSetCode: string | undefined = undefined;
        if (isWithNestedSets) {
            nestedSetCode = get(contentData, `${fieldPath}.nestedSetCode`);
        }
        return (
            <div className="flex flex-col gap-2">
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
                        fieldPath={fieldPath}
                        contentData={contentData}
                        disabled={isInAction}
                        onChange={handleContentDataChange}
                    />
                )}
                {fieldClass.type === 'rich_text' && (
                    <ControlTipTap
                        key={fieldPath}
                        controlKey={pageContentUniqueKey}
                        fieldPath={fieldPath}
                        contentData={contentData}
                        disabled={isInAction}
                        onChange={handleContentDataChange}
                    />
                )}
                {fieldClass.type === 'page_link' && (
                    <ControlLink
                        key={fieldPath}
                        controlKey={pageContentUniqueKey}
                        fieldPath={fieldPath}
                        contentData={contentData}
                        pagesData={pagesData}
                        disabled={isInAction}
                        onChange={handleContentDataChange}
                    />
                )}
                {isCompositeControl && (
                    <div className="py-2 pl-6 flex flex-col gap-6 border-l-[2px] border-slate-300 border-dotted">
                        {isWithNestedSets && (
                            <div className="flex flex-row items-center relative">
                                <span
                                    className="absolute -left-[24px] top-[calc(50%-1px)] w-[20px] border-t-[2px] border-dotted border-slate-300"/>
                                <ControlNestedSetSelect
                                    key={fieldPath}
                                    controlKey={pageContentUniqueKey}
                                    contentData={contentData}
                                    fieldClass={fieldClass}
                                    fieldPath={fieldPath}
                                    disabled={isInAction}
                                    onChange={handleContentDataChange}
                                />
                            </div>
                        )}
                        {fieldClass.nested?.map((nestedFieldClass: ContentDataFieldClass) => {
                            const nestedFieldPath = `${fieldPath}.nested.${nestedFieldClass.key}`;
                            return renderField(nestedFieldClass, nestedFieldPath, true, nestedSetCode);
                        })}
                    </div>
                )}
                <ActionDataFieldError
                    actionData={actionData}
                    fieldName={fieldPath}
                />
            </div>
        );
    };

    const pageCollapsedFields = collapsedFields[pageId] || {};

    const renderField = (
        fieldClass: ContentDataFieldClass,
        fieldPath: string,
        nested?: boolean,
        nestedSetCode?: string,
    ) => {
        if (nestedSetCode && fieldClass.nestedSetCodes) {
            if (!fieldClass.nestedSetCodes.includes(nestedSetCode)) {
                return null;
            }
        }
        const isFieldArray = !!fieldClass.isArray;
        if (isFieldArray) {
            const fieldsContents: Array<ContentDataField> = get(contentData, fieldPath, []) as Array<ContentDataField>;
            if (fieldsContents.length === 0) {
                return (
                    <div key={`firstField_${fieldClass.key}`}
                         className="relative flex flex-row gap-2 items-center justify-between pr-2">
                        <FieldLabel
                            label={fieldClass.label}
                            field=""
                            help={fieldClass.help}
                            nested={nested}
                            className="pr-2 bg-white z-20"
                            controls={
                                <span className="text-xs text-muted-foreground">[no items]</span>
                            }
                        />
                        <ButtonAction
                            Icon={LucidePlus}
                            size="xxs"
                            variant="outline"
                            className="hover-target"
                            onClick={handleAddNewField(fieldPath, 0)}
                        />
                        <div
                            className="z-10 absolute h-[0px] top-[calc(100%/2)] left-[0px] right-[30px] border-b-[2px] border-dotted border-slate-300 show-element"/>
                    </div>
                );
            } else {
                return fieldsContents.map((fieldContent, fieldContentIndex) => {
                    const fieldKey = `${fieldPath}.${fieldContentIndex}`;
                    return (
                        <div key={`field_${fieldClass.key}_${fieldContentIndex}`} className="flex flex-col gap-2">
                            <div
                                className="relative flex flex-row gap-2 items-center justify-between pr-2">
                                <FieldLabel
                                    label={fieldClass.label}
                                    field={fieldKey}
                                    help={fieldClass.help}
                                    composite={fieldClass.type === 'composite'}
                                    collapsed={pageCollapsedFields[fieldKey]}
                                    className="bg-white z-20 pr-2"
                                    controls={
                                        <IndexPositionBadge
                                            index={fieldContentIndex}
                                            length={fieldsContents.length}
                                            onSelect={handleMoveField(fieldPath, fieldContentIndex)}
                                            label={fieldClass.label}
                                        />
                                    }
                                    nested={nested}
                                    onToggle={handleToggleField(fieldKey)}
                                />
                                <div className="static flex flex-row gap-2 items-center hover-target">
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
                                <div
                                    className="z-10 absolute h-[0px] top-[calc(100%/2)] left-[0px] right-[60px] border-b-[2px] border-dotted border-slate-300 show-element"/>
                            </div>
                            {!pageCollapsedFields[fieldKey] && renderControl(fieldClass, `${fieldPath}.${fieldContentIndex}`)}
                        </div>
                    );
                });
            }
        } else {
            return (
                <div key={`field_${fieldClass.key}`} className="flex flex-col gap-2">
                    <FieldLabel
                        label={fieldClass.label}
                        field={fieldPath}
                        help={fieldClass.help}
                        nested={nested}
                        composite={fieldClass.type === 'composite'}
                        collapsed={pageCollapsedFields[fieldPath]}
                        onToggle={handleToggleField(fieldPath)}
                    />
                    {!pageCollapsedFields[fieldPath] && renderControl(fieldClass, fieldPath)}
                </div>
            );
        }
    };

    const pageCollapsedBlocks = collapsedBlocks[pageId] || {};

    return (
        <Card className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden">
            {isDataConfigMode
                ? (
                    <div className="flex-grow h-full w-full">
                        <CodeEditorJson
                            stateKey={getIdFromPK(TemplateEntry?.PK.S)}
                            readOnly={isInAction}
                            code={TemplateContent?.PageContentDataConfig.S || ''}
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
                                                    onSelect={() => saveSelectedDataGroups({
                                                        ...selectedDataGroups,
                                                        [getIdFromPK(pageEntry?.Entry?.PK.S)]: groupItem
                                                    })}
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
                                <ButtonAction
                                    size="sm"
                                    variant="ghost"
                                    title="Modify the configuration of the data fields"
                                    Icon={LucideSettings}
                                    onClick={() => setDataConfigMode(true)}
                                />
                            </div>
                        </CardContent>
                        <div className="flex-grow relative h-full">
                            <div className="absolute inset-0">
                                <ScrollArea viewportRef={scrollAreaRef} className="h-full w-full">
                                    <CardContent className="h-full flex flex-col gap-2 pb-36 relative">
                                        <div className="h-full w-full flex flex-col gap-4">
                                            {contentDataError && (
                                                <div>
                                                    <p className="text-xs text-red-600">{contentDataError}</p>
                                                </div>
                                            )}
                                            {groupedContentData.length === 0
                                                ? (
                                                    <div
                                                        className="flex flex-row gap-2 items-center justify-between px-2 py-1 border-[1px] border-dashed border-slate-300 rounded-[6px]">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground font-medium">No
                                                                Blocks</p>
                                                        </div>
                                                        <ContentDataBlockAddButton
                                                            blockRecords={selectedBlockClasses}
                                                            onSelect={(blockKey => handleAddNewBlock(blockKey, 0))}
                                                        />
                                                    </div>
                                                )
                                                : groupedContentData.map((contentDataBlock: ContentDataBlock, blockIndex) => {
                                                    const foundBlockClass = selectedBlockClasses[contentDataBlock.key];
                                                    const isBlockEmpty = isContentDataBlockEmpty(contentDataBlock);
                                                    if (foundBlockClass) {
                                                        const blockId = `block_${groupedContentDataIndexOffset[blockIndex]}_${contentDataBlock.key}`;
                                                        return (
                                                            <div
                                                                id={blockId}
                                                                key={blockId}
                                                                className={cn('flex flex-col gap-4', {'pb-4': !pageCollapsedBlocks[blockId]})}
                                                            >
                                                                <div
                                                                    className={cn("flex flex-row gap-4 items-center justify-between px-2 py-1 cursor-pointer rounded-[6px] border-[1px] border-transparent", {
                                                                        'bg-slate-100': !isBlockEmpty,
                                                                        'bg-orange-100': isBlockEmpty
                                                                    })}
                                                                    onClick={handleToggleBlock(blockId)}
                                                                >
                                                                    <div className="flex flex-row gap-2 items-center justify-center flex-grow">
                                                                        {pageCollapsedBlocks[blockId]
                                                                            ? (<LucideChevronRight className="text-muted-foreground w-4 h-4" />)
                                                                            : (<LucideChevronDown className="text-muted-foreground w-4 h-4" />)
                                                                        }
                                                                        <p className="text-sm text-muted-foreground font-medium line-clamp-1">
                                                                            {foundBlockClass.label}
                                                                        </p>
                                                                        <IndexPositionBadge
                                                                            index={blockIndex}
                                                                            length={groupedContentData.length}
                                                                            onSelect={handleMoveBlock(blockIndex)}
                                                                            label={foundBlockClass.label}
                                                                        />
                                                                        {isBlockEmpty && (
                                                                            <TooltipWrapper
                                                                                text="All block fields are empty!">
                                                                                <LucideAlertTriangle
                                                                                    className="w-3 h-3 cursor-pointer text-orange-700"/>
                                                                            </TooltipWrapper>
                                                                        )}
                                                                    </div>
                                                                    <div
                                                                        className="flex flex-row gap-2 items-center"
                                                                        onClick={e => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                        }}
                                                                    >
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
                                                                {!pageCollapsedBlocks[blockId] && (
                                                                    <div className="pl-6 flex flex-col gap-6">
                                                                        {foundBlockClass.fields.map((fieldClass: ContentDataFieldClass) => {
                                                                            const fieldPath = `${groupedContentDataIndexOffset[blockIndex]}.fields.${fieldClass.key}`;
                                                                            return renderField(fieldClass, fieldPath);
                                                                        })}
                                                                    </div>
                                                                )}
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
