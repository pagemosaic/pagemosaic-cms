import React from 'react';
import {LucideChevronDown} from 'lucide-react';
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
import {AssetsFilesPanel} from '@/features/editPage/AssetsFilesPanel';
import {AsyncStatusProvider} from '@/components/utils/AsyncStatusProvider';
import {usePagesBrowser} from '@/features/pages/PagesBrowserProvider';
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
        value: selectedDesignTab = 'html',
        saveValue: setSelectedDesignTab
    } = useSessionState<string>('selectedDesignTab');
    const splitterSizes = getSessionState<Array<number>>('editPageSplitterSizes') || [690, 700];

    const pageSessionTempKey = pageSessionKeys.tempPageSessionKey;

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
                                                    className="grid w-full grid-cols-5">
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
                            <PreviewPanel
                                pageSessionStateKey={pageSessionKeys.tempPageSessionKey}
                                templateSessionStateKey={pageSessionKeys.tempTemplateSessionKey}
                                siteSessionStateKey={siteSessionKeys.tempSiteSessionKey}
                            />
                        </Allotment.Pane>
                    </Allotment>
                </div>
            </div>
        </MainSubSection>
    );
}
