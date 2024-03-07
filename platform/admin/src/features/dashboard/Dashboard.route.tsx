import React, {useMemo} from 'react';
import {useLoaderData, Await} from 'react-router-dom';
import {MainSubSection} from '@/components/layouts/MainSubSection';
import {DelayedFallback} from '@/components/utils/DelayedFallback';
import {AwaitError} from '@/components/utils/AwaitError';
import {DashboardDataLoaderResponse} from '@/features/dashboard/dashboard.loader';
import {Dashboard} from '@/features/dashboard/Dashboard';

export function DashboardRoute() {
    const {
        pagesDataRequest,
        generatorDataRequest,
        assetsFilesDataRequest,
        staticFilesDataRequest
    } = useLoaderData() as DashboardDataLoaderResponse;

    const complexDefer = useMemo(() => {
        return Promise.all([
            pagesDataRequest,
            generatorDataRequest,
            staticFilesDataRequest,
            assetsFilesDataRequest,
        ]);
    }, [
        pagesDataRequest,
        generatorDataRequest,
        assetsFilesDataRequest,
        staticFilesDataRequest
    ]);

    return (
        <MainSubSection>
            <React.Suspense fallback={<DelayedFallback />}>
                <Await
                    resolve={complexDefer}
                    errorElement={<AwaitError/>}
                >
                    {([pagesData, generatorData, staticFilesData, assetsFilesData]) => {
                        return (
                            <Dashboard
                                pagesData={pagesData}
                                generatorData={generatorData}
                                staticFilesData={staticFilesData}
                                assetsFilesData={assetsFilesData}
                            />
                        );
                    }}
                </Await>
            </React.Suspense>
        </MainSubSection>
    );
}
