import React from 'react';
import {Await, useLoaderData} from 'react-router-dom';
import {AwaitError} from '@/components/utils/AwaitError';
import {MainSubSection} from '@/components/layouts/MainSubSection';
import {DelayedFallback} from '@/components/utils/DelayedFallback';
import {GalleryView} from '@/features/gallery/GalleryView';
import {GalleryDataLoaderResponse} from '@/features/gallery/gallery.loader';
import {RestoreProvider} from '@/roots/main/RestoreProvider';

export function GalleryRoute() {
    const {galleryDataRequest} = useLoaderData() as GalleryDataLoaderResponse;

    return (
        <RestoreProvider>
            <MainSubSection>
                <React.Suspense fallback={<DelayedFallback/>}>
                    <Await
                        resolve={galleryDataRequest}
                        errorElement={<AwaitError/>}
                    >
                        {(galleryData) => {
                            return (
                                <GalleryView galleryData={galleryData}/>
                            );
                        }}
                    </Await>
                </React.Suspense>
            </MainSubSection>
        </RestoreProvider>
    );
}
