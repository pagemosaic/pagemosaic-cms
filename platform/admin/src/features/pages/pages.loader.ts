import {defer, ShouldRevalidateFunctionArgs, LoaderFunctionArgs} from 'react-router-dom';
import {PagesDataRequest, pagesDataSingleton} from '@/data/PagesData';
import {GeneratorDataRequest, generatorDataSingleton} from '@/data/GeneratorData';

export type AllPagesDataLoaderResponse = {
    pagesDataRequest: PagesDataRequest;
    generatorDataRequest: GeneratorDataRequest;
};

export async function pagesLoader({request}: LoaderFunctionArgs) {
    // const url = new URL(request.url);
    // const entryType: string | undefined = url.searchParams.get('entryType') || undefined;
    // const tagId: string | undefined = url.searchParams.get('tagId') || undefined;
    return defer({
        pagesDataRequest: pagesDataSingleton.getPagesData(),
        generatorDataRequest: generatorDataSingleton.getGenerator()
    });
}

const validActions = ['saveChanges', 'revertChanges', 'makeCopy', 'deletePage', 'createPage', 'updateTemplateTitle'];

export function allPagesLoaderGuard(args: ShouldRevalidateFunctionArgs): boolean {
    const {formData, actionResult, defaultShouldRevalidate} = args;
    if (formData && actionResult) {
        const action = formData.get('action') as string;
        return action === 'publishPages'
            || (validActions.includes(action) && !!actionResult.ok);
    }
    return defaultShouldRevalidate;
}
