import React, {RefAttributes, forwardRef, useImperativeHandle, useState} from 'react';
import {Sheet, SheetContent} from '@/components/ui/sheet';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {useSessionState} from '@/utils/localStorage';
import {PageDataHelpPanel} from '@/features/helpSheet/PageDataHelpPanel';
import {PageDataSessionKeys, pageDataSingleton} from '@/data/PageData';
import {SiteDataSessionKeys} from '@/data/SiteData';
import {DI_TemplateEntry, DI_SiteEntry, DI_PageEntry} from 'infra-common/data/DocumentItem';
import {SiteDataHelpPanel} from '@/features/helpSheet/SiteDataHelpPanel';
import {ExtraDataHelpPanel} from '@/features/helpSheet/ExtraDataHelpPanel';
import {PagesData} from '@/data/PagesData';
import {SelectTrigger, SelectValue, SelectContent, SelectItem, Select} from '@/components/ui/select';
import {getIdFromPK} from 'infra-common/utility/database';

export type HelpSheepHandler = {
    openHelp: () => void;
    closeHelp: () => void;
    toggleHelp: () => void;
};

export type HelpSheetProps = RefAttributes<HelpSheepHandler> & {
    pagesData: PagesData;
    pageSessionKeys: PageDataSessionKeys;
    siteSessionKeys: SiteDataSessionKeys;
}

export const HelpSheet = forwardRef<HelpSheepHandler, HelpSheetProps>((props, ref) => {
    const {pagesData, pageSessionKeys, siteSessionKeys} = props;
    const {value: selectedTab = 'pageData', saveValue: setSelectedTab} = useSessionState<string>('helpSheetSelectedTab');
    const {value: pageEntry} = useSessionState<DI_PageEntry>(pageSessionKeys.tempPageSessionKey);
    const {value: templateEntry} = useSessionState<DI_TemplateEntry>(pageSessionKeys.tempTemplateSessionKey);
    const {value: siteEntry} = useSessionState<DI_SiteEntry>(siteSessionKeys.tempSiteSessionKey);

    const pageId = getIdFromPK(pageEntry?.Entry?.PK.S);
    const templateId = getIdFromPK(templateEntry?.Entry?.PK.S);

    const {
        value: selectedTemplateRecords = {[pageId]: templateId},
        saveValue: setSelectedTemplateRecords
    } = useSessionState<Record<string, string>>('helpSheetSelectedTemplateRecords');

    const [open, setOpen] = useState<boolean>(false);

    useImperativeHandle(ref, () => ({
        closeHelp: () => {
            setOpen(false);
        },
        openHelp: () => {
            setOpen(true);
        },
        toggleHelp: () => {
            setOpen(!open);
        }
    }));

    let selectedTemplateEntryId = selectedTemplateRecords[pageId] || templateId;
    const foundTemplateEntry = pageDataSingleton.getTempTemplateEntry(selectedTemplateEntryId)
        || pagesData?.templateEntries.find(i => getIdFromPK(i.Entry?.PK.S) === selectedTemplateEntryId);

    return (
        <Sheet open={open} onOpenChange={setOpen} modal={false}>
            <SheetContent
                className="w-[700px] sm:w-[700px]"
                side="right"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <Tabs
                    defaultValue={selectedTab}
                    className="flex flex-col gap-2 w-full h-full"
                    onValueChange={(newValue: string) => setSelectedTab(newValue)}
                >
                    <div className="w-full">
                        <Select
                            onValueChange={(templateId: string) => {
                                setSelectedTemplateRecords({...selectedTemplateRecords, [pageId]: templateId});
                            }}
                            value={selectedTemplateEntryId}
                        >
                            <SelectTrigger className="w-[calc(100%-20px)]">
                                <SelectValue placeholder="Select Template..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {pagesData?.templateEntries.map(({Entry, Meta}) => {
                                    const templateItemId = getIdFromPK(Entry?.PK.S);
                                    return (
                                        <SelectItem
                                            key={templateItemId}
                                            value={templateItemId}
                                        >
                                            {Meta?.TemplateTitle.S || ''}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <TabsList className="grid w-[calc(100%-20px)] grid-cols-3">
                        <TabsTrigger value="pageData">
                            Page Data
                        </TabsTrigger>
                        {/*<TabsTrigger value="metaData">*/}
                        {/*    Meta Data*/}
                        {/*</TabsTrigger>*/}
                        <TabsTrigger value="siteData">
                            Site Data
                        </TabsTrigger>
                        <TabsTrigger value="more">
                            More...
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex-grow relative w-full h-full pr-[20px] pb-20 overflow-auto">
                        <TabsContent value="pageData">
                            <div className="flex flex-col gap-2">
                                <PageDataHelpPanel
                                    pageContentDataConfig={foundTemplateEntry?.Content?.PageContentDataConfig.S || '{}'}
                                />
                            </div>
                        </TabsContent>
                        {/*<TabsContent value="metaData">*/}
                        {/*    <div className="flex flex-col gap-2">*/}
                        {/*        <MetaDataHelpPanel />*/}
                        {/*    </div>*/}
                        {/*</TabsContent>*/}
                        <TabsContent value="siteData">
                            <div className="flex flex-col gap-2">
                                <SiteDataHelpPanel
                                    siteContentDataConfig={siteEntry?.SiteContent?.SiteContentDataConfig.S || '{}'}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="more">
                            <div className="flex flex-col gap-2">
                                <ExtraDataHelpPanel templateEntries={pagesData?.templateEntries} />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
});
