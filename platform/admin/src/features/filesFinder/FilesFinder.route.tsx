import {useLoaderData, Await} from 'react-router-dom';
import {AwaitError} from '@/components/utils/AwaitError';
import React from 'react';
import {FilesFinderLoaderResponse} from '@/features/filesFinder/filesFinder.loader';
import {PublicBucketStaticData} from '@/data/PublicBucketData';
import {FilesFinder} from '@/features/filesFinder/FilesFinder';
import {AsyncStatusProvider} from '@/components/utils/AsyncStatusProvider';
import {ActionFormProvider} from '@/components/utils/ActionFormProvider';
import {DelayedFallback} from '@/components/utils/DelayedFallback';

export function FilesFinderRoute() {
    const {publicBucketDataRequest} = useLoaderData() as FilesFinderLoaderResponse;
    return (
        <React.Suspense fallback={<DelayedFallback />}>
            <Await
                resolve={publicBucketDataRequest}
                errorElement={<AwaitError/>}
            >
                {(publicBucketData: PublicBucketStaticData) => {
                    return (
                        <ActionFormProvider>
                            <AsyncStatusProvider>
                                <FilesFinder publicBucketData={publicBucketData} />
                            </AsyncStatusProvider>
                        </ActionFormProvider>
                    );
                }}
            </Await>
        </React.Suspense>
    );
}
