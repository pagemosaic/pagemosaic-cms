import React, {useRef, useState, useEffect} from 'react';
import {LucidePencilRuler, LucideCheck} from 'lucide-react';
import debounce from 'lodash-es/debounce';
import imagePlaceholder from '@/assets/image-placeholder.svg';
import {Input} from '@/components/ui/input';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {Label} from '@/components/ui/label';

type ImageParams = {
    width: number;
    height: number;
};

interface ExternalImagePreviewProps {
    imageUrl?: string;
    onSelect: (url: string) => void;
}

export function ExternalImagePreview(props: ExternalImagePreviewProps) {
    const {imageUrl, onSelect} = props;
    const imageElementRef = useRef<HTMLImageElement>(null);
    const [imageParams, setImageParams] = useState<ImageParams>({width: 0, height: 0});

    useEffect(() => {
        if (imageElementRef.current) {
            imageElementRef.current.src = imageUrl || imagePlaceholder;
        }
    }, [imageUrl]);

    const debouncedUrlChange = debounce((value: string) => {
        if (imageElementRef.current) {
            imageElementRef.current.src = value || imagePlaceholder;
        }
    }, 800);

    const handleImageLoadingSuccess = () => {
        if (imageElementRef.current && imageElementRef.current.src && imageElementRef.current.complete) {
            if (!imageElementRef.current.src.includes(imagePlaceholder)) {
                setImageParams({
                    width: imageElementRef.current.naturalWidth,
                    height: imageElementRef.current.naturalHeight
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

    return (
        <div className="flex flex-col gap-2 h-[450px] justify-between">
            <div className="w-full flex flex-row gap-4 items-start justify-start">
                <div
                    className="w-[250px] h-[250px] rounded-md border-[1px] border-slate-200 flex-grow-0 overflow-hidden">
                    <img
                        ref={imageElementRef}
                        // src={imageElementRef.current?.src}
                        alt={'Unknown'}
                        className="h-auto w-auto object-cover object-center aspect-square"
                        onLoad={handleImageLoadingSuccess}
                        onError={handleImageLoadingError}
                    />
                </div>
                <div className="flex flex-col gap-2 grow">
                    <div className="w-full flex flex-col gap-2">
                        <Label className="text-muted-foreground">
                            External Image Url
                        </Label>
                        <Input
                            type="text"
                            defaultValue={imageUrl}
                            placeholder="Enter an external image url"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => debouncedUrlChange(e.currentTarget.value)}
                        />
                    </div>
                    {/*<div className="flex flex-row items-center gap-2">*/}
                    {/*    <LucideLink className="w-3 h-3"/>*/}
                    {/*    <span className="text-sm text-muted-foreground line-clamp-1">*/}
                    {/*        {validImageSrc || ''}*/}
                    {/*    </span>*/}
                    {/*</div>*/}
                    <div className="flex flex-row items-center gap-2">
                        <LucidePencilRuler className="w-3 h-3"/>
                        <span className="text-sm text-muted-foreground">
                            width: {imageParams.width}px, height: {imageParams.height}px
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex flex-row justify-end items-center">
                <ButtonAction
                    disabled={imageParams.width === 0 || imageParams.height === 0}
                    Icon={LucideCheck}
                    label="Select"
                    size="sm"
                    onClick={() => {
                        if (imageElementRef.current?.src) {
                            onSelect(imageElementRef.current.src);
                        }
                    }}
                />
            </div>
        </div>
    );
}