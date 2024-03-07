import {defer, ShouldRevalidateFunctionArgs} from 'react-router-dom';
import {PublicBucketStaticDataRequest, publicBucketDataSingleton} from '@/data/PublicBucketData';

export type FilesFinderLoaderResponse = {
    publicBucketDataRequest: PublicBucketStaticDataRequest;
};

export async function filesFinderLoader() {
    return defer({
        publicBucketDataRequest: publicBucketDataSingleton.getPublicStaticFiles()
    });
}

export function filesFinderLoaderGuard(args: ShouldRevalidateFunctionArgs): boolean {
    const {formData, actionResult, defaultShouldRevalidate} = args;
    if (formData && actionResult) {
        const action = formData.get('action') as string;
        return ['addFolder', 'deleteFiles'].includes(action) && !!actionResult.ok;
    }
    return defaultShouldRevalidate;
}
