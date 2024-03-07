import {defer, ShouldRevalidateFunctionArgs} from 'react-router-dom';
import {WebsiteUrlDataRequest, websiteDataSingleton} from '@/data/WebsiteUrlData';

export type EditDomainDataLoaderResponse = {
    websiteUrlDataRequest: WebsiteUrlDataRequest;
};

export async function editDomainLoader() {
    return defer({
        websiteUrlDataRequest: websiteDataSingleton.getWebsiteUrlData()
    });
}

const refreshActions = ['addDomain', 'linkDomain'];

export function editDomainLoaderGuard(args: ShouldRevalidateFunctionArgs): boolean {
    const {formData, actionResult, defaultShouldRevalidate, currentUrl, nextUrl} = args;
    if (formData && actionResult) {
        const action = formData.get('action') as string;
        return refreshActions.includes(action) && !!actionResult.ok;
    } else if (nextUrl.searchParams.size !== currentUrl.searchParams.size) {
        return false;
    }
    return defaultShouldRevalidate;
}
