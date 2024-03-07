import React, {useMemo, useRef, useState} from 'react';
import debounce from 'lodash-es/debounce';
import set from 'lodash-es/set';
import get from 'lodash-es/get';
import imagePlaceholder from '@/assets/image-placeholder.svg';
import {Input} from '@/components/ui/input';
import {BrowseFilesButton} from '@/features/editPage/BrowseFilesButton';
import {ContentData} from 'infra-common/data/ContentData';
import {useSystemInfo} from '@/data/useSystemInfo';
import {Label} from '@/components/ui/label';
import {LucidePencilRuler, LucideTrash2} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';

type ImageParams = {
    width: number;
    height: number;
};

interface ControlImageProps {
    controlKey: number;
    contentData: ContentData;
    fieldPath: string;
    disabled?: boolean;
    onChange: (newContentData: ContentData, doRefresh?: boolean) => void;
}

export function ControlImage(props: ControlImageProps) {
    const {controlKey, contentData, fieldPath, disabled, onChange} = props;
    const {defaultWebsiteUrl} = useSystemInfo();
    const imageElementRef = useRef<HTMLImageElement>(null);
    const [imageParams, setImageParams] = useState<ImageParams>({width: 0, height: 0});

    const handleImageLoadingSuccess = () => {
        if (imageElementRef.current && imageElementRef.current.src) {
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
        const srcFieldPath = `${fieldPath}.imageSrc`;
        const altFieldPath = `${fieldPath}.imageAlt`;
        const debouncedOnAltTextChange = debounce((path: string, value: string) => {
            if (contentData) {
                const newContentData = set(contentData, path, value);
                onChange(newContentData);
            }
        }, 800);

        const handleAltTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            debouncedOnAltTextChange(altFieldPath, e.currentTarget.value);
        };

        const handleImageSelect = (url: string) => {
            if (contentData) {
                const newContentData = set(contentData, srcFieldPath, url);
                onChange(newContentData, true);
            }
        };

        let defaultImageSrcValue = get(
            contentData,
            srcFieldPath,
            undefined
        ) as string | undefined;

        let defaultImageAltValue = get(
            contentData,
            altFieldPath,
            undefined
        ) as string | undefined;

        let validImageSrc: string | undefined = defaultImageSrcValue;
        if (!validImageSrc) {
           validImageSrc = imagePlaceholder;
        } else if (validImageSrc.startsWith('/')) {
            validImageSrc = `${defaultWebsiteUrl}${validImageSrc}`;
        }

        return (
            <div className="w-full flex flex-row gap-3 items-start justify-start">
                <div className="w-[150px] h-[150px] rounded-md border-[1px] border-slate-200 flex-grow-0 overflow-hidden">
                    <img
                        key={controlKey}
                        ref={imageElementRef}
                        src={validImageSrc}
                        alt={'Unknown'}
                        className="h-auto w-auto object-cover object-top aspect-square"
                        onLoad={handleImageLoadingSuccess}
                        onError={handleImageLoadingError}
                    />
                </div>
                <div className="flex flex-col gap-2 grow">
                    <div className="w-full flex flex-col gap-2">
                        <Label className="text-muted-foreground">
                            Image Alt Text
                        </Label>
                        <Input
                            key={controlKey}
                            name={altFieldPath}
                            type="text"
                            disabled={disabled}
                            defaultValue={defaultImageAltValue}
                            onChange={handleAltTextChange}
                        />
                    </div>
                    {(imageParams.width > 0 || imageParams.height > 0) && (
                        <div className="flex flex-row gap-2 items-center">
                            <LucidePencilRuler className="w-3 h-3"/>
                            <span className="text-sm text-muted-foreground">width: {imageParams.width}px,
                                height: {imageParams.height}px</span>
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
    }, [controlKey, imageParams]);
}