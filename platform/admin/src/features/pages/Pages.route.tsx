import React, {useMemo} from 'react';
import {Await, useLoaderData} from 'react-router-dom';
import {AwaitError} from '@/components/utils/AwaitError';
import {AllPagesDataLoaderResponse} from '@/features/pages/pages.loader';
import {AllPagesView} from '@/features/pages/AllPagesView';
import {ActionFormProvider} from '@/components/utils/ActionFormProvider';
import {MainSubSection} from '@/components/layouts/MainSubSection';
import {DelayedFallback} from '@/components/utils/DelayedFallback';

export function PagesRoute() {
    const {pagesDataRequest, generatorDataRequest} = useLoaderData() as AllPagesDataLoaderResponse;

    const complexDefer = useMemo(() => {
        return Promise.all([pagesDataRequest, generatorDataRequest]);
    }, [pagesDataRequest, generatorDataRequest]);

    return (
        <ActionFormProvider>
            <MainSubSection>
                <React.Suspense fallback={<DelayedFallback />}>
                    <Await
                        resolve={complexDefer}
                        errorElement={<AwaitError/>}
                    >
                        {([pagesData, generatorData]) => {
                            return (
                                <AllPagesView
                                    pagesData={pagesData}
                                    generatorData={generatorData}
                                />
                            );
                        }}
                    </Await>
                </React.Suspense>
            </MainSubSection>
        </ActionFormProvider>
    );
}
