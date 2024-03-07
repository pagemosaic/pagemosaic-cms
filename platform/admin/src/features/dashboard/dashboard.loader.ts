import {defer, LoaderFunctionArgs} from 'react-router-dom';
import {PagesDataRequest, pagesDataSingleton} from '@/data/PagesData';
import {GeneratorDataRequest, generatorDataSingleton} from '@/data/GeneratorData';
import {
    PublicBucketStaticDataRequest,
    PublicBucketAssetsDataRequest, publicBucketDataSingleton
} from '@/data/PublicBucketData';

export type DashboardDataLoaderResponse = {
    pagesDataRequest: PagesDataRequest;
    generatorDataRequest: GeneratorDataRequest;
    staticFilesDataRequest: PublicBucketStaticDataRequest;
    assetsFilesDataRequest: PublicBucketAssetsDataRequest;
};

export async function dashboardLoader() {
    return defer({
        pagesDataRequest: pagesDataSingleton.getPagesData(),
        generatorDataRequest: generatorDataSingleton.getGenerator(),
        staticFilesDataRequest: publicBucketDataSingleton.getPublicStaticFiles(),
        assetsFilesDataRequest: publicBucketDataSingleton.getPublicAssetsFiles()
    });
}
