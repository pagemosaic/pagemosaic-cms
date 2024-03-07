import {Await, useLoaderData} from 'react-router-dom';
import {AwaitError} from '@/components/utils/AwaitError';
import React from 'react';
import {EditDomainDataLoaderResponse} from './editDomain.loader';
import {WebsiteUrlData} from '@/data/WebsiteUrlData';
import {WebsiteUrlView} from './WebsiteUrlView';
import {ActionFormProvider} from '@/components/utils/ActionFormProvider';

export function EditDomainRoute() {
    const {websiteUrlDataRequest} = useLoaderData() as EditDomainDataLoaderResponse;
    return (
        <ActionFormProvider>
            <React.Suspense fallback={<WebsiteUrlView isLoadingData={true}/>}>
                <Await
                    resolve={websiteUrlDataRequest}
                    errorElement={<AwaitError/>}
                >
                    {(websiteUrlData: WebsiteUrlData) => {
                        return (
                            <WebsiteUrlView
                                websiteUrlData={websiteUrlData}
                            />
                        );
                    }}
                </Await>
            </React.Suspense>
        </ActionFormProvider>
    );
}
