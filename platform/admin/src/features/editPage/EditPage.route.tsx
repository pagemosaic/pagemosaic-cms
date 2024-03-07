import React, {useMemo} from 'react';
import {useLoaderData, Await, useParams} from 'react-router-dom';
import {AwaitError} from '@/components/utils/AwaitError';
import {EditPageSkeleton} from '@/features/editPage/EditPageSkeleton';
import {ActionFormProvider} from '@/components/utils/ActionFormProvider';
import {PublicFilesBrowserProvider} from '@/features/filesFinder/PublicFilesBrowserProvider';
import {PagesBrowserProvider} from '@/features/pages/PagesBrowserProvider';
import {setSessionState, getSessionState} from '@/utils/localStorage';
import {HelpSheetProvider} from '@/features/helpSheet/HelpSheetProvider';
import {EditPageLoaderResponse} from './editPage.loader';
import {EditPageForm} from './EditPageForm';
import {PagesSheetProvider} from '@/features/pagesSheet/PagesSheetProvider';
import {HistoryDataProvider} from '@/features/editPage/HistoryDataProvider';

export function EditPageRoute() {
    const {pageId} = useParams();
    const {editPageDataRequest, pagesDataRequest, siteDataRequest} = useLoaderData() as EditPageLoaderResponse;

    const complexDefer = useMemo(() => {
        return Promise.all([editPageDataRequest, pagesDataRequest, siteDataRequest])
            .then((data) => {
                setSessionState('pageContentUniqueKey', (getSessionState<number>('pageContentUniqueKey') || 0) + 1); // force controls to rerender
                return data;
            });
    }, [editPageDataRequest, pagesDataRequest, siteDataRequest]);

    return (
        <ActionFormProvider key={pageId}>
            <React.Suspense fallback={<EditPageSkeleton/>}>
                <Await
                    resolve={complexDefer}
                    errorElement={<AwaitError/>}
                >
                    {([pageSessionKeys, pagesData, siteSessionKeys]) => {
                        return (
                            <PagesBrowserProvider>
                                <PublicFilesBrowserProvider>
                                    <HelpSheetProvider
                                        pagesData={pagesData}
                                        pageSessionKeys={pageSessionKeys}
                                        siteSessionKeys={siteSessionKeys}
                                    >
                                        <PagesSheetProvider pagesData={pagesData}>
                                            <HistoryDataProvider pageSessionKeys={pageSessionKeys}>
                                                <EditPageForm
                                                    key={pageSessionKeys.savedPageSessionKey}
                                                    pageSessionKeys={pageSessionKeys}
                                                    siteSessionKeys={siteSessionKeys}
                                                    pagesData={pagesData}
                                                />
                                            </HistoryDataProvider>
                                        </PagesSheetProvider>
                                    </HelpSheetProvider>
                                </PublicFilesBrowserProvider>
                            </PagesBrowserProvider>
                        );
                    }}
                </Await>
            </React.Suspense>
        </ActionFormProvider>
    );
}
