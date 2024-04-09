import React, {useState, useMemo, useRef, useEffect} from 'react';
import get from 'lodash-es/get';
import set from 'lodash-es/set';
import cloneDeep from 'lodash-es/cloneDeep';
import {
    LucideSettings,
    LucideMinus,
    LucidePlus,
    LucideChevronDown,
    LucideCopy,
    LucideAlertTriangle,
    LucideChevronRight,
    LucideLayoutList,
    LucideListCollapse
} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {useSessionState} from '@/utils/localStorage';
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
import {DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {ControlLink} from '@/features/editPage/ControlLink';
import {PagesData} from '@/data/PagesData';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {ContentDataBlockAddButton} from '@/features/editPage/ContentDataBlockAddButton';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';
import {ControlStringWithVariants} from '@/features/editPage/ControlStringWithVariants';
import {useHistoryData} from '@/features/editPage/HistoryDataProvider';
import {ControlNestedSetSelect} from '@/features/editPage/ControlNestedSetSelect';
import {FieldLabel} from './FieldLabel';

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
        value: selectedGroup = '',
        saveValue: saveSelectedGroup
    } = useSessionState<string>('selectedSiteDataGroup');
    const {
        value: expandedBlocks = [],
        saveValue: setExpandedBlocks
    } = useSessionState<Array<boolean>>('siteContentExpandedBlocks');
    const {
        value: collapsedFields = {},
        saveValue: setCollapsedFields
    } = useSessionState<Record<string, Array<boolean>>>('siteContentCollapsedFields');

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

    let contentDataError = '';

    let contentData: ContentData = useMemo(() => {
        let result: ContentData = [];
        try {
            result = JSON.parse(SiteContent.SiteContentData.S);
        } catch (e: any) {
            contentDataError = 'Error parsing the content data values.';
        }
        return result;
    }, [SiteContent.SiteContentData]);

    let contentDataConfigClass: ContentDataConfigClass = useMemo(() => {
        let result: ContentDataConfigClass = {};
        if (SiteContent.SiteContentDataConfig.S) {
            try {
                result = JSON.parse(SiteContent.SiteContentDataConfig.S);
            } catch (e: any) {
                contentDataError = 'Error parsing the content data configuration. Please double check the data config settings.';
            }
        }
        return result;
    }, [SiteContent.SiteContentDataConfig]);

    let groups: Array<{groupKey: string; blocks: Array<{label: string; blockIndex: number;}>}> = useMemo(() => {
        let result: Array<{groupKey: string; blocks: Array<{label: string; blockIndex: number;}>}> = [];
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
                    foundGroup.blocks.push({
                        label: foundBlock.blockLabel,
                        blockIndex: contentDataItemIndex
                    });
                }
            }
            contentDataItemIndex++;
        }
        result = result.sort(g => g.groupKey === 'Default' ? 0 : 1)
        return result;
    }, [contentDataConfigClass, contentData]);

    useEffect(() => {
        if (!selectedGroup) {
            let newSelectedGroup = groups.length > 0 ? groups[0].groupKey : 'Default';
            if (newSelectedGroup !== 'Default' && groups.findIndex(g => g.groupKey === newSelectedGroup) < 0) {
                newSelectedGroup = 'Default';
            }
            saveSelectedGroup(newSelectedGroup);
        }
    }, []);

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

    const handleSelectGroup = (groupKey: string, blockIndex?: number) => {
        saveSelectedGroup(groupKey)
        if (blockIndex !== undefined) {
            toggleBlock(blockIndex, {doExpand: true});
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const foundBlockTitleElement = document.getElementById(`block_${blockIndex}`);
                    if (foundBlockTitleElement) {
                        scrollAreaRef.current.scrollTo({top: foundBlockTitleElement.offsetTop, behavior: 'smooth'});
                    }
                }
            }, 300);
        }
    };

    const toggleBlock = (blockIndex: number, options?: {doExpand?: boolean; doRemove?: boolean; doAdd?: boolean; doMove?: boolean; newBlockIndex?: number;}) => {
        let newExpandedBlocks = [...expandedBlocks];
        if (options?.doAdd) {
            newExpandedBlocks.splice(blockIndex, 0, true);
        } else if (options?.doExpand) {
            newExpandedBlocks[blockIndex] = true;
        } else if (options?.doRemove) {
            newExpandedBlocks.splice(blockIndex, 1);
        } else if (options?.doMove && options?.newBlockIndex !== undefined && options?.newBlockIndex >= 0) {
            newExpandedBlocks = arrayMove(newExpandedBlocks, blockIndex, options.newBlockIndex);
        } else {
            newExpandedBlocks[blockIndex] = !newExpandedBlocks[blockIndex];
        }
        setExpandedBlocks(newExpandedBlocks);
    };

    const handleCollapseBlocks = () => {
        setExpandedBlocks([]);
    };

    const handleToggleBlock = (blockIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        toggleBlock(blockIndex);
    };

    const toggleField = (fieldPath: string, fieldIndex: number, options?: {doAdd?: boolean; doRemove?: boolean; doMove?: boolean; newFieldIndex?: number}) => {
        let collapsedIndexes = [...(collapsedFields[fieldPath] || [])];
        if (options?.doAdd) {
            collapsedIndexes.splice(fieldIndex, 0, false);
        } else if (options?.doRemove) {
            collapsedIndexes.splice(fieldIndex, 1);
        } else if (options?.doMove && options?.newFieldIndex !== undefined && options?.newFieldIndex >= 0) {
            collapsedIndexes = arrayMove(collapsedIndexes, fieldIndex, options.newFieldIndex);
        } else {
            collapsedIndexes[fieldIndex] = !collapsedIndexes[fieldIndex];
        }
        collapsedFields[fieldPath] = collapsedIndexes;
        setCollapsedFields({...collapsedFields});
    };

    const handleToggleField = (fieldPath: string, fieldIndex: number, options?: {doAdd?: boolean; doRemove?: boolean; doMove?: boolean; newFieldIndex?: number}) => () => {
        toggleField(fieldPath, fieldIndex, options);
    };

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

    const handleAddNewBlock = (code: string, blockIndex: number, increment: number = 0) => {
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            const newIndex = blockIndex + increment;
            prevContentData.splice(newIndex, 0, {
                key: code,
                fields: {}
            });
            const newContentData: ContentData = buildOrUpdateContentObject(
                contentDataConfigClass,
                prevContentData
            );
            SiteContent.SiteContentData.S = JSON.stringify(newContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            toggleBlock(newIndex, {doAdd: true});
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const blockKey = `block_${newIndex}`;
                    const foundBlockTitleElement = document.getElementById(blockKey);
                    if (foundBlockTitleElement) {
                        scrollAreaRef.current.scrollTo({top: foundBlockTitleElement.offsetTop, behavior: 'smooth'});
                    }
                }
            }, 300);
        }
    };

    const handleCopyBlock = (blockIndex: number) => {
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            const oldIndex = blockIndex;
            const newBlockContent: ContentDataBlock = cloneDeep(prevContentData[oldIndex]);
            const newIndex = oldIndex + 1;
            prevContentData.splice(newIndex, 0, newBlockContent);
            SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            toggleBlock(newIndex, {doAdd: true});
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const blockKey = `block_${newIndex}`;
                    const foundBlockTitleElement = document.getElementById(blockKey);
                    if (foundBlockTitleElement) {
                        scrollAreaRef.current.scrollTo({top: foundBlockTitleElement.offsetTop, behavior: 'smooth'});
                    }
                }
            }, 300);
        }
    };

    const handleRemoveBlock = (blockIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            toggleBlock(blockIndex, {doRemove: true});
            prevContentData.splice(blockIndex, 1);
            SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
        }
    };

    const handleMoveBlock = (blockIndex: number, newBlockIndex: number) => {
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            let prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            const selectedBlockIndex = blockIndex;
            const targetBlockIndex = newBlockIndex;
            prevContentData = arrayMove(prevContentData, selectedBlockIndex, targetBlockIndex);
            toggleBlock(selectedBlockIndex, {doMove: true, newBlockIndex});
            SiteContent.SiteContentData.S = JSON.stringify(prevContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const newBlockKey = `block_${targetBlockIndex}`;
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
        if (SiteContent && Entry) {
            putIntoHistory({siteEntry});
            const prevContentData = JSON.parse(SiteContent.SiteContentData.S);
            const fieldContentData: Array<ContentDataField> = get(prevContentData, fieldPath, []);
            fieldContentData.splice(fieldIndex, 0, {});
            set(prevContentData, fieldPath, fieldContentData);
            const newContentData: ContentData = buildOrUpdateContentObject(
                contentDataConfigClass,
                prevContentData
            );
            SiteContent.SiteContentData.S = JSON.stringify(newContentData);
            Entry.EntryUpdateDate.N = Date.now().toString();
            saveSiteEntry(siteEntry);
            setPageContentUniqueKey(pageContentUniqueKey + 1);
            toggleField(fieldPath, fieldIndex, {doAdd: true});
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    const fieldKey = `${fieldPath}.${fieldIndex}`;
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
                toggleField(fieldPath, fieldIndex, {doRemove: true});
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
                toggleField(fieldPath, fieldIndex, {doMove: true, newFieldIndex});
                setTimeout(() => {
                    if (scrollAreaRef.current) {
                        const fieldKey = `${fieldPath}.${newFieldIndex}`;
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
                    const collapsedIndexes = collapsedFields[fieldPath] || [];
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
                                    collapsed={collapsedIndexes[fieldContentIndex]}
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
                                    onToggle={handleToggleField(fieldPath, fieldContentIndex)}
                                />
                                <div className="flex flex-row gap-2 items-center hover-target">
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
                            {!collapsedIndexes[fieldContentIndex] && renderControl(fieldClass, `${fieldPath}.${fieldContentIndex}`)}
                        </div>
                    );
                });
            }
        } else {
            const collapsedIndexes = collapsedFields[fieldPath] || [];
            return (
                <div key={`field_${fieldClass.key}`} className="flex flex-col gap-2">
                    <FieldLabel
                        label={fieldClass.label}
                        field={fieldPath}
                        help={fieldClass.help}
                        nested={nested}
                        composite={fieldClass.type === 'composite'}
                        collapsed={collapsedIndexes[0]}
                        onToggle={handleToggleField(fieldPath, 0)}
                    />
                    {!collapsedIndexes[0] && renderControl(fieldClass, fieldPath)}
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
                                            variant="outline"
                                            disabled={isInAction || groups.length === 0}
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
                                                            <span className="max-w-[300px] line-clamp-1">{groupItem.groupKey}</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
                                                                {groupItem.blocks.map((blockItem, blockIndexInGroup) => {
                                                                    return (
                                                                        <DropdownMenuItem
                                                                            key={`block_${blockItem.blockIndex}_select`}
                                                                            onSelect={() => handleSelectGroup(groupItem.groupKey, blockItem.blockIndex)}
                                                                        >
                                                                            <span className="text-left max-w-[300px] line-clamp-1">{blockItem.label}</span>
                                                                            <span className="text-muted-foreground ml-2 text-xs">#{blockIndexInGroup + 1}</span>
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
                                                    <span className="max-w-[300px] line-clamp-1">{groupItem.groupKey}</span>
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
                                                        className="flex flex-row gap-2 items-center justify-between px-2 py-1 border-[1px] border-dashed border-slate-100 rounded-[6px]">
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
                                                : groupedContentData.map((contentDataBlock: ContentDataBlock, blockIndexInGroup) => {
                                                    const foundBlockClass = selectedBlockClasses[contentDataBlock.key];
                                                    const isBlockEmpty = isContentDataBlockEmpty(contentDataBlock);
                                                    if (foundBlockClass) {
                                                        const blockIndex = Object.keys(groupedContentDataIndexOffset).length > 0
                                                            ? groupedContentDataIndexOffset[blockIndexInGroup]
                                                            : 0;
                                                        const blockId = `block_${blockIndex}`;
                                                        const isBlockExpanded = expandedBlocks[blockIndex];
                                                        return (
                                                            <div
                                                                id={blockId}
                                                                key={blockId}
                                                                className={cn('flex flex-col gap-4', {'pb-4': isBlockExpanded})}
                                                            >
                                                                <div
                                                                    className={cn("flex flex-row gap-4 items-center justify-between px-2 py-1 rounded-[6px] border-[1px] border-transparent cursor-pointer", {
                                                                        'bg-slate-100': !isBlockEmpty,
                                                                        'bg-orange-100': isBlockEmpty
                                                                    })}
                                                                    onClick={handleToggleBlock(blockIndex)}
                                                                >
                                                                    <div
                                                                        className="flex flex-row gap-2 items-center justify-center flex-grow">
                                                                        {isBlockExpanded
                                                                            ? (<LucideChevronDown
                                                                                className="text-muted-foreground w-4 h-4"/>)
                                                                            : (<LucideChevronRight
                                                                                className="text-muted-foreground w-4 h-4"/>)
                                                                        }
                                                                        <p className="text-sm text-muted-foreground font-medium line-clamp-1">
                                                                            {foundBlockClass.label}
                                                                        </p>
                                                                        <IndexPositionBadge
                                                                            index={blockIndexInGroup}
                                                                            length={groupedContentData.length}
                                                                            onSelect={(selectedIndexInGroup: number) => {
                                                                                const newBlockIndex = Object.keys(groupedContentDataIndexOffset).length > 0
                                                                                    ? groupedContentDataIndexOffset[selectedIndexInGroup]
                                                                                    : 0;
                                                                                handleMoveBlock(blockIndex, newBlockIndex);
                                                                            }}
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
                                                                {isBlockExpanded && (
                                                                    <div className="pl-6 flex flex-col gap-6">
                                                                        {foundBlockClass.fields.map((fieldClass: ContentDataFieldClass) => {
                                                                            const fieldPath = `${blockIndex}.fields.${fieldClass.key}`;
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
