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
    LucideChevronRight, LucideLayoutList, LucideListCollapse
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
    DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent
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
        value: expandedBlocks = {},
        saveValue: setExpandedBlocks
    } = useSessionState<Record<string, Record<string, boolean>>>('pageContentExpandedBlocks');
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

    let contentDataError = '';

    let contentData: ContentData = useMemo(() => {
        let result: ContentData = [];
        try {
            result = JSON.parse(Content?.PageContentData.S);
        } catch (e: any) {
            contentDataError = 'Error parsing the content data values.';
        }
        return result;
    }, [Content?.PageContentData]);

    let contentDataConfigClass: ContentDataConfigClass = useMemo(() => {
        let result: ContentDataConfigClass = {};
        if (TemplateContent?.PageContentDataConfig.S) {
            try {
                result = JSON.parse(TemplateContent?.PageContentDataConfig.S);
            } catch (e: any) {
                contentDataError = 'Error parsing the content data configuration. Please double check the config settings.';
            }
        }
        return result;
    }, [TemplateContent?.PageContentDataConfig]);

    let groups: Array<{groupKey: string; blocks: Array<{label: string; blockKey: string;}>}> = useMemo(() => {
        let result: Array<{groupKey: string; blocks: Array<{label: string; blockKey: string;}>}> = [];
        const blocksMap: Record<string, {groupKey: string; blockLabel: string;}> = {};
        let groupKey: string;
        for (const [key, configClass] of Object.entries(contentDataConfigClass)) {
            groupKey = configClass.group || 'Default';
            blocksMap[key] = { groupKey, blockLabel: configClass.label };
            let foundGroup = result.find(g => g.groupKey === groupKey);
            if (!foundGroup) {
                foundGroup = {
                    groupKey,
                    blocks: []
                };
                result.push(foundGroup);
            }
        }
        let contentDataItemIndex = 0;
        for (const contentDataItem of contentData) {
            const foundBlock = blocksMap[contentDataItem.key];
            if (foundBlock) {
                let foundGroup = result.find(g => g.groupKey === foundBlock.groupKey);
                if (foundGroup) {
                    const blockKey = `block_${contentDataItemIndex}_${contentDataItem.key}`;
                    foundGroup.blocks.push({
                        label: foundBlock.blockLabel,
                        blockKey
                    });
                }
            }
            contentDataItemIndex++;
        }
        return result;
    }, [contentDataConfigClass, contentData]);

    const pageId = getIdFromPK(pageEntry.Entry?.PK.S)
    let selectedGroup = selectedDataGroups[pageId] || 'Default';
    if (selectedGroup !== 'Default' && groups.findIndex(g => g.groupKey === selectedGroup) < 0) {
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

    const pageCollapsedFields = collapsedFields[pageId] || {};

    const handleSelectGroup = (groupKey: string, blockKey?: string) => {
        saveSelectedDataGroups({
            ...selectedDataGroups,
            [getIdFromPK(pageEntry?.Entry?.PK.S)]: groupKey
        })
        if (blockKey) {
            toggleBlock(blockKey, {doAdd: true});
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const foundBlockTitleElement = document.getElementById(blockKey);
                    if (foundBlockTitleElement) {
                        scrollAreaRef.current.scrollTo({top: foundBlockTitleElement.offsetTop, behavior: 'smooth'});
                    }
                }
            }, 300);
        }
    };

    const toggleBlock = (blockKey: string, options?: {doRemove?: boolean; doAdd?: boolean;}) => {
        let pageExpandedBlocks = expandedBlocks[pageId] || {};
        if (options?.doRemove) {
            delete pageExpandedBlocks[blockKey];
        } else if (options?.doAdd) {
            pageExpandedBlocks[blockKey] = true;
        } else {
            pageExpandedBlocks[blockKey] = !pageExpandedBlocks[blockKey];
        }
        setExpandedBlocks({...expandedBlocks, [pageId]: pageExpandedBlocks});
    };

    const handleCollapseBlocks = () => {
        let pageExpandedBlocks = expandedBlocks[pageId] || {};
        let foundGroup = groups.find(g => g.groupKey === selectedGroup);
        if (foundGroup && foundGroup.blocks.length > 0) {
            for (const block of foundGroup.blocks) {
                delete pageExpandedBlocks[block.blockKey];
            }
            setExpandedBlocks({...expandedBlocks, [pageId]: pageExpandedBlocks});
        }
    };

    const handleToggleBlock = (blockKey: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        toggleBlock(blockKey);
    };

    const handleToggleField = (fieldKey: string, options?: {doAdd?: boolean; doRemove?: boolean}) => () => {
        let pageCollapsedFields = collapsedFields[pageId] || {};
        if (options?.doAdd) {
            pageCollapsedFields[fieldKey] = true;
        } else if (options?.doRemove) {
            delete pageCollapsedFields[fieldKey];
        } else {
            pageCollapsedFields[fieldKey] = !pageCollapsedFields[fieldKey];
        }
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
            const newIndex = Object.keys(groupedContentDataIndexOffset).length > 0
                ? groupedContentDataIndexOffset[groupedBlockIndex] + increment
                : 0;
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
            const blockKey = `block_${newIndex}_${code}`;
            toggleBlock(blockKey, {doAdd: true});
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const foundBlockTitleElement = document.getElementById(blockKey);
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
            const blockKey = `block_${newIndex}_${newBlockContent.key}`;
            toggleBlock(blockKey, {doAdd: true});
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const foundBlockTitleElement = document.getElementById(blockKey);
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
            const blockIndex = groupedContentDataIndexOffset[groupedBlockIndex];
            const blockContent: ContentDataBlock = cloneDeep(prevContentData[blockIndex]);
            const blockKey = `block_${blockIndex}_${blockContent.key}`;
            toggleBlock(blockKey, {doRemove: true});
            prevContentData.splice(blockIndex, 1);
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
            const selectedBlockIndex = groupedContentDataIndexOffset[groupedBlockIndex];
            const targetBlockIndex = groupedContentDataIndexOffset[newGroupedBlockIndex];
            const selectedBlockKey = `block_${selectedBlockIndex}_${prevContentData[selectedBlockIndex].key}`;
            const targetBlockKey = `block_${targetBlockIndex}_${prevContentData[targetBlockIndex].key}`;
            let pageExpandedBlocks = expandedBlocks[pageId] || {};
            const selectedBlockExpanded = pageExpandedBlocks[selectedBlockKey];
            const targetBlockExpanded = pageExpandedBlocks[targetBlockKey];
            const newBlockKey = `block_${targetBlockIndex}_${prevContentData[selectedBlockIndex].key}`;
            pageExpandedBlocks[`block_${selectedBlockIndex}_${prevContentData[targetBlockIndex].key}`] = targetBlockExpanded;
            pageExpandedBlocks[newBlockKey] = selectedBlockExpanded;
            setExpandedBlocks({...expandedBlocks, [pageId]: pageExpandedBlocks});
            prevContentData = arrayMove(prevContentData, selectedBlockIndex, targetBlockIndex);
            Content.PageContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            setSessionState(pageSessionStateKey, pageEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const foundBlockTitleElement = document.getElementById(newBlockKey);
                    if (foundBlockTitleElement) {
                        scrollAreaRef.current.scrollTo({top: foundBlockTitleElement.offsetTop, behavior: 'smooth'});
                    }
                }
            }, 300);
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
            const fieldKey = `${fieldPath}.${fieldIndex}`;
            handleToggleField(fieldKey, {doAdd: true});
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const foundElement = document.getElementById(fieldKey);
                    if (foundElement) {
                        scrollAreaRef.current.scrollTo({top: foundElement.offsetTop, behavior: 'smooth'});
                    }
                }
            }, 300);
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
                const fieldKey = `${fieldPath}.${fieldIndex}`;
                handleToggleField(fieldKey, {doRemove: true});
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
                let pageCollapsedFields = collapsedFields[pageId] || {};
                const fieldKey = `${fieldPath}.${newFieldIndex}`;
                const oldFieldKey = `${fieldPath}.${fieldIndex}`;
                const collapsedNewField = pageCollapsedFields[fieldKey];
                pageCollapsedFields[fieldKey] = pageCollapsedFields[oldFieldKey];
                pageCollapsedFields[oldFieldKey] = collapsedNewField;
                setCollapsedFields({...collapsedFields, [pageId]: pageCollapsedFields});
                setTimeout(() => {
                    if (scrollAreaRef.current) {
                        const foundElement = document.getElementById(fieldKey);
                        if (foundElement) {
                            scrollAreaRef.current.scrollTo({top: foundElement.offsetTop, behavior: 'smooth'});
                        }
                    }
                }, 300);
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
                        <div
                            id={fieldKey}
                            key={`field_${fieldClass.key}_${fieldContentIndex}`}
                            className="flex flex-col gap-2"
                        >
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

    const pageExpandedBlocks = expandedBlocks[pageId] || {};

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
                                            variant="outline"
                                            disabled={isInAction || groups.length <= 1}
                                            className="justify-start"
                                        >
                                            <LucideLayoutList className="w-4 h-4 mr-2"/>
                                            <span className="text-left max-w-[300px] line-clamp-1">{selectedGroup}</span>
                                            <LucideChevronDown className="w-4 h-4 ml-2"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {groups.map((groupItem, groupIdx) => {
                                            if (groupItem.blocks.length > 0) {
                                                return (
                                                    <DropdownMenuSub key={groupItem.groupKey}>
                                                        <DropdownMenuSubTrigger>
                                                            <span className="text-left max-w-[300px] line-clamp-1">{groupItem.groupKey}</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
                                                                {groupItem.blocks.map((blockItem, blockItemIdx) => {
                                                                    return (
                                                                        <DropdownMenuItem
                                                                            key={blockItem.blockKey}
                                                                            onSelect={() => handleSelectGroup(groupItem.groupKey, blockItem.blockKey)}
                                                                        >
                                                                            <span className="text-left max-w-[300px] line-clamp-1">{blockItem.label}</span>
                                                                            <span className="text-muted-foreground ml-2 text-xs">#{blockItemIdx + 1}</span>
                                                                        </DropdownMenuItem>
                                                                    );
                                                                })}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                );
                                            }
                                            return (
                                                <DropdownMenuItem
                                                    key={groupItem.groupKey}
                                                    onSelect={() => handleSelectGroup(groupItem.groupKey)}
                                                >
                                                    <span className="text-left max-w-[300px] line-clamp-1">{groupItem.groupKey}</span>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div>
                                   <ButtonAction Icon={LucideListCollapse} variant="ghost" size="sm" onClick={handleCollapseBlocks} title="Collapse all blocks" />
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
                                                                // className={cn('flex flex-col gap-4', {'pb-4': !pageCollapsedBlocks[blockId]})}
                                                                className={cn('flex flex-col gap-4', {'pb-4': pageExpandedBlocks[blockId]})}
                                                            >
                                                                <div
                                                                    className={cn("flex flex-row gap-4 items-center justify-between px-2 py-1 cursor-pointer rounded-[6px] border-[1px] border-transparent", {
                                                                        'bg-slate-100': !isBlockEmpty,
                                                                        'bg-orange-100': isBlockEmpty
                                                                    })}
                                                                    onClick={handleToggleBlock(blockId)}
                                                                >
                                                                    <div className="flex flex-row gap-2 items-center justify-center flex-grow">
                                                                        {pageExpandedBlocks[blockId]
                                                                            ? (<LucideChevronDown className="text-muted-foreground w-4 h-4" />)
                                                                            : (<LucideChevronRight className="text-muted-foreground w-4 h-4" />)
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
                                                                {pageExpandedBlocks[blockId] && (
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
