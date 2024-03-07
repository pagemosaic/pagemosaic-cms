import {defer} from 'react-router-dom';
import {GalleryDataRequest, galleryDataSingleton} from '@/data/GalleryData';

export type GalleryDataLoaderResponse = {
    galleryDataRequest: GalleryDataRequest;
};

export async function galleryLoader() {
    return defer({
        galleryDataRequest: galleryDataSingleton.getData()
    });
}
