import React, {useMemo} from 'react';
import {LucideChevronDown, LucidePlus, LucideX} from 'lucide-react';
import {Allotment} from 'allotment';
import {ActionDataRequestError} from '@/components/utils/ActionDataRequestError';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {ActionDataFieldErrorBadge} from '@/components/utils/ActionDataFieldErrorBadge';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {ContentHtmlPanel} from '@/features/editPage/ContentHtmlPanel';
import {ContentStylesPanel} from '@/features/editPage/ContentStylesPanel';
import {PreviewPanel} from '@/features/editPage/PreviewPanel';
import {ContentDataPanel} from '@/features/editPage/ContentDataPanel';
import {EditPageFormTitle} from '@/features/editPage/EditPageFormTitle';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {PageDataSessionKeys} from '@/data/PageData';
import {MainSubSection} from '@/components/layouts/MainSubSection';
import {PagesData} from '@/data/PagesData';
import {SiteDataSessionKeys} from '@/data/SiteData';
import {SiteContentDataPanel} from '@/features/editPage/SiteContentDataPanel';
import {useSessionState, getSessionState, setSessionState} from '@/utils/localStorage';
import {ContentArticlePanel} from '@/features/editPage/ContentArticlePanel';
import {SiteStylesPanel} from '@/features/editPage/SiteStylesPanel';
import {SiteScriptsPanel} from '@/features/editPage/SiteScriptsPanel';
import {AssetsFilesPanel} from '@/features/editPage/AssetsFilesPanel';
import {AsyncStatusProvider} from '@/components/utils/AsyncStatusProvider';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {getIdFromPK} from 'infra-common/utility/database';
import {DI_PageEntry} from 'infra-common/data/DocumentItem';
import {usePagesBrowser} from '@/features/pages/PagesBrowserProvider';
import {IFrameToolbox} from '@/components/utils/IFrameToolbox';
import {SiteBodyScriptsPanel} from '@/features/editPage/SiteBodyScriptsPanel';
import {SitePartialsPanel} from '@/features/editPage/SitePartialsPanel';

interface EditPageFormProps {
    pageSessionKeys: PageDataSessionKeys;
    siteSessionKeys: SiteDataSessionKeys;
    pagesData: PagesData;
}

export function EditPageForm(props: EditPageFormProps) {
    const {pageSessionKeys, siteSessionKeys, pagesData} = props;
    const {showDialog} = usePagesBrowser();
    const {actionData} = useActionForm();
    const {
        value: selectedEditorTabs = {},
        saveValue: setSelectedEditorTabs
    } = useSessionState<Record<string, string>>('selectedEditorTabs');
    const {
        value: selectedPreviewTabs = {},
        saveValue: setSelectedPreviewTabs
    } = useSessionState<Record<string, string>>('selectedPreviewTabs');
    const {
        value: extraPreviews = {},
        saveValue: setExtraPreviews
    } = useSessionState<Record<string, Array<string>>>('extraPreviews');
    const {
        value: selectedDesignTab = 'html',
        saveValue: setSelectedDesignTab
    } = useSessionState<string>('selectedDesignTab');
    const splitterSizes = getSessionState<Array<number>>('editPageSplitterSizes') || [690, 700];

    const pageSessionTempKey = pageSessionKeys.tempPageSessionKey;
    let extraPreviewPages: Array<DI_PageEntry> = useMemo(() => {
        const extraPreviewsIds: Array<string> | undefined = extraPreviews[pageSessionTempKey];
        let extraPreviewPages: Array<DI_PageEntry> = [];
        if (extraPreviewsIds && extraPreviewsIds.length > 0) {
            let foundPreviewPage: DI_PageEntry | undefined;
            for (const previewId of extraPreviewsIds) {
                foundPreviewPage = pagesData?.pageEntries.find(i => getIdFromPK(i.Entry?.PK.S) === previewId);
                if (foundPreviewPage) {
                    extraPreviewPages.push(foundPreviewPage);
                }
            }
        }
        return extraPreviewPages;
    }, [extraPreviews, pageSessionTempKey, pagesData]);

    const selectedPreviewTab = selectedPreviewTabs[pageSessionTempKey] || 'current';
    let selectedExtraPreviewPage: DI_PageEntry | undefined = undefined;
    if (selectedPreviewTab !== 'current') {
        selectedExtraPreviewPage = pagesData?.pageEntries.find(i => getIdFromPK(i.Entry?.PK.S) === selectedPreviewTab);
    }

    return (
        <MainSubSection>
            <div className="w-full h-full p-4 flex flex-col gap-4">
                <EditPageFormTitle pageSessionKeys={pageSessionKeys} siteSessionKeys={siteSessionKeys}/>
                <ActionDataRequestError actionData={actionData}/>
                <div className="w-full h-full flex-grow relative">
                    <Allotment
                        vertical={false}
                        defaultSizes={splitterSizes}
                        onDragEnd={(sizes) => {
                            setSessionState('editPageSplitterSizes', sizes);
                        }}
                    >
                        <Allotment.Pane minSize={500} className="pr-2">
                            <div className="h-full w-full relative">
                                <Tabs
                                    defaultValue={selectedEditorTabs[pageSessionTempKey] || 'pageData'}
                                    onValueChange={(newValue: string) => {
                                        setSelectedEditorTabs({...selectedEditorTabs, [pageSessionTempKey]: newValue});
                                    }}
                                    className="flex flex-col gap-2 w-full h-full"
                                >
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="pageData">
                                            <ActionDataFieldErrorBadge
                                                actionData={actionData}
                                                fieldNames={['PageContentData']}
                                            >
                                                Page
                                            </ActionDataFieldErrorBadge>
                                        </TabsTrigger>
                                        <TabsTrigger value="pageArticle">
                                            <ActionDataFieldErrorBadge
                                                actionData={actionData}
                                                fieldNames={['PageArticleData']}
                                            >
                                                Article
                                            </ActionDataFieldErrorBadge>
                                        </TabsTrigger>
                                        <TabsTrigger value="siteData">
                                            <ActionDataFieldErrorBadge
                                                actionData={actionData}
                                                fieldNames={['SiteContentData']}
                                            >
                                                Site
                                            </ActionDataFieldErrorBadge>
                                        </TabsTrigger>
                                        <TabsTrigger value="design">
                                            <div className="flex flex-row gap-2 items-center">
                                                <span>Design</span>
                                                <LucideChevronDown className="w-4 h-4"/>
                                            </div>
                                        </TabsTrigger>
                                    </TabsList>
                                    <ActionDataFieldError
                                        actionData={actionData}
                                        fieldName="sessionStateKey"
                                    />
                                    <div className="flex-grow relative w-full h-full">
                                        <TabsContent value="pageData"
                                                     className="absolute top-0 left-0 right-0 bottom-0">
                                            <ContentDataPanel
                                                pageSessionStateKey={pageSessionKeys.tempPageSessionKey}
                                                templateSessionStateKey={pageSessionKeys.tempTemplateSessionKey}
                                                actionData={actionData}
                                                pagesData={pagesData}
                                            />
                                        </TabsContent>
                                        <TabsContent value="pageArticle"
                                                     className="absolute top-0 left-0 right-0 bottom-0">
                                            <ContentArticlePanel
                                                pageSessionStateKey={pageSessionKeys.tempPageSessionKey}
                                                actionData={actionData}
                                            />
                                        </TabsContent>
                                        <TabsContent value="siteData"
                                                     className="absolute top-0 left-0 right-0 bottom-0">
                                            <SiteContentDataPanel
                                                siteSessionStateKey={siteSessionKeys.tempSiteSessionKey}
                                                actionData={actionData}
                                                pagesData={pagesData}
                                            />
                                        </TabsContent>
                                        <TabsContent value="design"
                                                     className="absolute top-0 left-0 right-0 bottom-0">
                                            <Tabs
                                                defaultValue={selectedDesignTab}
                                                onValueChange={(newValue: string) => setSelectedDesignTab(newValue)}
                                                className="flex flex-col gap-2 w-full h-full"
                                            >
                                                <TabsList
                                                    className="grid w-full grid-cols-7">
                                                    <TabsTrigger value="html">
                                                        <ActionDataFieldErrorBadge
                                                            actionData={actionData}
                                                            fieldNames={['Html']}
                                                        >
                                                            Html
                                                        </ActionDataFieldErrorBadge>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="styles">
                                                        <ActionDataFieldErrorBadge
                                                            actionData={actionData}
                                                            fieldNames={['Styles']}
                                                        >
                                                            Styles
                                                        </ActionDataFieldErrorBadge>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="siteStyles">
                                                        <span className="line-clamp-1">Global Styles</span>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="siteScripts">
                                                        <span className="line-clamp-1">Head Scripts</span>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="siteBodyScripts">
                                                        <span className="line-clamp-1">Body Scripts</span>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="sitePartials">
                                                        <span>Partials</span>
                                                    </TabsTrigger>
                                                    <TabsTrigger value="siteAssets">
                                                        Assets
                                                    </TabsTrigger>
                                                </TabsList>
                                                <div className="relative flex-grow w-full h-full">
                                                    <TabsContent value="html"
                                                                 className="absolute top-0 left-0 right-0 bottom-0">
                                                        <ContentHtmlPanel
                                                            templateSessionStateKey={pageSessionKeys.tempTemplateSessionKey}
                                                            actionData={actionData}
                                                        />
                                                    </TabsContent>
                                                    <TabsContent value="styles"
                                                                 className="absolute top-0 left-0 right-0 bottom-0">
                                                        <ContentStylesPanel
                                                            templateSessionStateKey={pageSessionKeys.tempTemplateSessionKey}
                                                            actionData={actionData}
                                                        />
                                                    </TabsContent>
                                                    <TabsContent value="siteStyles"
                                                                 className="absolute top-0 left-0 right-0 bottom-0">
                                                        <SiteStylesPanel
                                                            siteSessionStateKey={siteSessionKeys.tempSiteSessionKey}
                                                            actionData={actionData}
                                                        />
                                                    </TabsContent>
                                                    <TabsContent value="siteScripts"
                                                                 className="absolute top-0 left-0 right-0 bottom-0">
                                                        <SiteScriptsPanel
                                                            siteSessionStateKey={siteSessionKeys.tempSiteSessionKey}
                                                            actionData={actionData}
                                                        />
                                                    </TabsContent>
                                                    <TabsContent value="siteBodyScripts"
                                                                 className="absolute top-0 left-0 right-0 bottom-0">
                                                        <SiteBodyScriptsPanel
                                                            siteSessionStateKey={siteSessionKeys.tempSiteSessionKey}
                                                            actionData={actionData}
                                                        />
                                                    </TabsContent>
                                                    <TabsContent value="sitePartials"
                                                                 className="absolute top-0 left-0 right-0 bottom-0">
                                                        <SitePartialsPanel
                                                            siteSessionStateKey={siteSessionKeys.tempSiteSessionKey}
                                                        />
                                                    </TabsContent>
                                                    <TabsContent value="siteAssets"
                                                                 className="absolute top-0 left-0 right-0 bottom-0">
                                                        <AsyncStatusProvider>
                                                            <AssetsFilesPanel/>
                                                        </AsyncStatusProvider>
                                                    </TabsContent>
                                                </div>
                                            </Tabs>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </Allotment.Pane>
                        <Allotment.Pane className="pl-2" minSize={350}>
                            <div className="h-full w-full relative">
                                <Tabs
                                    value={selectedPreviewTab}
                                    onValueChange={(newValue: string) => {
                                        setSelectedPreviewTabs({
                                            ...selectedPreviewTabs,
                                            [pageSessionTempKey]: newValue
                                        });
                                    }}
                                    className="flex flex-col gap-2 w-full h-full"
                                >
                                    <div className="flex flex-row items-center gap-2 justify-between">
                                        <div className="flex flex-row items-center gap-2">
                                            <TabsList className="flex flex-row items-center gap-1 flex-nowrap">
                                                <TabsTrigger value="current">
                                                    Current Page
                                                </TabsTrigger>
                                                {extraPreviewPages.map((extraPreviewPage, idx) => {
                                                    const extraPreviewPageId = getIdFromPK(extraPreviewPage.Entry?.PK.S);
                                                    return (
                                                        <div key={extraPreviewPageId}
                                                             className="flex flex-row gap-2 items-center">
                                                            <TabsTrigger value={extraPreviewPageId}>
                                                                <span
                                                                    className="max-w-[250px] line-clamp-1">{extraPreviewPage.Meta?.PageTitle.S}</span>
                                                            </TabsTrigger>
                                                            <ButtonAction
                                                                size="xxs"
                                                                variant="ghost"
                                                                Icon={LucideX}
                                                                onClick={() => {
                                                                    const newExtraPreviews = {...extraPreviews};
                                                                    let extraPreviewsIds: Array<string> | undefined = newExtraPreviews[pageSessionTempKey];
                                                                    if (extraPreviewsIds) {
                                                                        const foundIndex = extraPreviewsIds.findIndex(i => i === extraPreviewPageId);
                                                                        if (foundIndex >= 0) {
                                                                            extraPreviewsIds.splice(foundIndex, 1);
                                                                        }
                                                                    }
                                                                    setExtraPreviews(newExtraPreviews);
                                                                    setSelectedPreviewTabs({
                                                                        ...selectedPreviewTabs,
                                                                        [pageSessionTempKey]: 'current'
                                                                    });
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </TabsList>
                                            {extraPreviewPages.length < 2 && (
                                                <div>
                                                    <ButtonAction
                                                        Icon={LucidePlus}
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            showDialog({
                                                                title: 'Pages',
                                                                onSelect: (pageId) => {
                                                                    let extraPreviewsIds: Array<string> = extraPreviews[pageSessionTempKey] || [];
                                                                    const foundExistingId = extraPreviewsIds.findIndex(i => i === pageId);
                                                                    if (foundExistingId < 0) {
                                                                        extraPreviewsIds.push(pageId);
                                                                        const newExtraPreviews = {
                                                                            ...extraPreviews,
                                                                            [pageSessionTempKey]: extraPreviewsIds
                                                                        };
                                                                        setExtraPreviews(newExtraPreviews);
                                                                    }
                                                                    setSelectedPreviewTabs({
                                                                        ...selectedPreviewTabs,
                                                                        [pageSessionTempKey]: pageId
                                                                    });
                                                                }
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <IFrameToolbox/>
                                        </div>
                                    </div>
                                    <div className="flex-grow relative w-full h-full">
                                        <TabsContent value="current"
                                                     className="absolute top-0 left-0 right-0 bottom-0">
                                            <PreviewPanel
                                                pageSessionStateKey={pageSessionKeys.tempPageSessionKey}
                                                templateSessionStateKey={pageSessionKeys.tempTemplateSessionKey}
                                                siteSessionStateKey={siteSessionKeys.tempSiteSessionKey}
                                            />
                                        </TabsContent>
                                        <TabsContent value={selectedPreviewTab}
                                                     className="absolute top-0 left-0 right-0 bottom-0">
                                            <PreviewPanel
                                                pageId={selectedPreviewTab}
                                                templateId={selectedExtraPreviewPage?.Meta?.PageTemplateId.S}
                                                pageSessionStateKey={pageSessionKeys.tempPageSessionKey}
                                                templateSessionStateKey={pageSessionKeys.tempTemplateSessionKey}
                                                siteSessionStateKey={siteSessionKeys.tempSiteSessionKey}
                                            />
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </Allotment.Pane>
                    </Allotment>
                </div>
            </div>
        </MainSubSection>
    );
}
