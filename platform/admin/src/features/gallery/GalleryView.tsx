import React from 'react';
import {LucideUploadCloud, LucideArrowRight} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {WebsiteTemplateCard} from '@/features/gallery/WebsiteTemplateCard';
import {ScrollArea} from '@/components/ui/scroll-area';
import {GalleryData} from '@/data/GalleryData';
import {useRestore} from '@/roots/main/RestoreProvider';

interface GalleryViewProps {
    galleryData: GalleryData;
}

export function GalleryView(props: GalleryViewProps) {
    const {galleryData} = props;
    const {showDialog} = useRestore();

    return (
        <div className="w-full h-full flex flex-col py-4 gap-4">
            <div className="flex flex-row justify-between items-center px-4 gap-4">
                <div className="flex flex-row gap-4 items-center">
                    <p className="text-xl">Websites Gallery</p>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <div>
                        <p className="text-sm">After you've downloaded the template package successfully, you can install the template by uploading the file</p>
                    </div>
                    <LucideArrowRight className="w-5 h-5" />
                    <ButtonAction
                        Icon={LucideUploadCloud}
                        size="default"
                        label="Upload Package"
                        onClick={() => showDialog({})}
                    />
                </div>
            </div>
            <ScrollArea className="flex-grow w-full h-full px-4">
                <div className="w-full grid sm:grid-cols-2 grid-cols-1 gap-4">
                    {galleryData?.index.map((galleryItem, index) => {
                        return (
                            <WebsiteTemplateCard key={`galleryIndex_${index}`} attrs={galleryItem}/>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}