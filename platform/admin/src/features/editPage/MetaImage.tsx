import React, {useMemo, useRef, useState} from 'react';
import {LucidePencilRuler, LucideLink, LucideTrash2} from 'lucide-react';
import imagePlaceholder from '@/assets/image-placeholder.svg';
import {BrowseFilesButton} from '@/features/editPage/BrowseFilesButton';
import {useSystemInfo} from '@/data/useSystemInfo';
import {ButtonAction} from '@/components/utils/ButtonAction';

type ImageParams = {
    width: number;
    height: number;
};

interface MetaImageProps {
    controlKey: number;
    disabled?: boolean;
    imageSrc?: string;
    onChange: (imageSrc: string) => void;
}

export function MetaImage(props: MetaImageProps) {
    const {controlKey, disabled, imageSrc, onChange} = props;
    const {defaultWebsiteUrl} = useSystemInfo();
    const imageElementRef = useRef<HTMLImageElement>(null);
    const [imageParams, setImageParams] = useState<ImageParams>({width: 0, height: 0});

    const handleImageLoadingSuccess = () => {
        if (imageElementRef.current && imageElementRef.current.src && imageElementRef.current.complete) {
            if (!imageElementRef.current.src.includes(imagePlaceholder)) {
                setImageParams({
                    width: imageElementRef.current.naturalWidth,
                    height: imageElementRef.current.naturalHeight
                });
            } else {
                setImageParams({
                    width: 0,
                    height: 0
                });
            }
        }
    };

    const handleImageLoadingError = () => {
        if (imageElementRef.current && imageElementRef.current.src) {
            setImageParams({
                width: 0,
                height: 0
            });
        }
    };

    return useMemo(() => {
        const handleImageSelect = (url: string) => {
            onChange(url);
        };

        let validImageSrc: string | undefined = imageSrc;
        if (!validImageSrc) {
           validImageSrc = imagePlaceholder;
        } else if (validImageSrc.startsWith('/')) {
            validImageSrc = `${defaultWebsiteUrl}${validImageSrc}`;
        }

        return (
            <div className="w-full flex flex-row gap-4 items-start justify-start">
                <div className="w-[150px] h-[150px] rounded-md border-[1px] border-slate-200 flex-grow-0 overflow-hidden">
                    <img
                        key={controlKey}
                        ref={imageElementRef}
                        src={validImageSrc}
                        alt={'Unknown'}
                        className="h-full w-full object-cover object-top aspect-square"
                        onLoad={handleImageLoadingSuccess}
                        onError={handleImageLoadingError}
                    />
                </div>
                <div className="flex flex-col gap-2 grow">
                    {imageSrc && (
                        <div className="flex flex-row items-center gap-2">
                            <LucideLink className="w-3 h-3"/>
                            <span className="text-sm text-muted-foreground line-clamp-1">
                                {imageSrc}
                            </span>
                        </div>
                    )}
                    {(imageParams.width > 0 || imageParams.height > 0) && (
                        <div className="flex flex-row items-center gap-2">
                            <LucidePencilRuler className="w-3 h-3"/>
                            <span className="text-sm text-muted-foreground">
                                width: {imageParams.width}px, height: {imageParams.height}px
                            </span>
                        </div>
                    )}
                    <div className="flex flex-row gap-2 items-center">
                        <BrowseFilesButton
                            disabled={disabled}
                            onSelect={handleImageSelect}
                        />
                        <ButtonAction
                            variant="secondary"
                            size="sm"
                            Icon={LucideTrash2}
                            label="Clear"
                            onClick={() => {
                                handleImageSelect('');
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }, [imageParams, imageSrc]);
}