import {defer, ShouldRevalidateFunctionArgs, LoaderFunctionArgs, redirect} from 'react-router-dom';
import {PageDataRequest, pageDataSingleton} from '@/data/PageData';
import {PagesDataRequest, pagesDataSingleton} from '@/data/PagesData';
import {SiteDataRequest, siteDataSingleton} from '@/data/SiteData';

export type EditPageLoaderResponse = {
    editPageDataRequest: PageDataRequest;
    pagesDataRequest: PagesDataRequest;
    siteDataRequest: SiteDataRequest;
};

export async function editPageLoader({params}: LoaderFunctionArgs) {
    if (params.pageId) {
        return defer({
            editPageDataRequest: pageDataSingleton.getEditPage({pageId: params.pageId}),
            pagesDataRequest: pagesDataSingleton.getPagesData(),
            siteDataRequest: siteDataSingleton.getEditSite()
        });
    }
    return redirect('/pages');
}

export function editPageLoaderGuard(args: ShouldRevalidateFunctionArgs): boolean {
    const {formData, actionResult, defaultShouldRevalidate} = args;
    if (formData && actionResult) {
        const action = formData.get('action') as string;
        return 'updatePageMeta' === action && !!actionResult.ok;
    }
    return defaultShouldRevalidate;
}
