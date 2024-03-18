import {FileObject} from 'infra-common/system/Bucket';
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover';
import imagePlaceholder from '@/assets/image-placeholder.svg';
import React from 'react';

interface FileObjectPreviewProps {
    fileObject: FileObject;
    label: string;
}

const imageTypesMap: Record<string, boolean> = {
    'png': true,
    'jpg': true,
    'jpeg': true,
    'webp': true,
    'avif': true,
    'gif': true,
};

export function FileObjectPreview(props: FileObjectPreviewProps) {
    const {fileObject, label} = props;
    const fileExt = fileObject.id.split('.').pop();
    if (fileExt && imageTypesMap[fileExt]) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <span className="cursor-pointer">{label}</span>
                </PopoverTrigger>
                <PopoverContent side="right" sideOffset={50} className="w-80">
                    <div
                        className="w-full rounded-md border-[1px] border-slate-200 flex-grow-0 overflow-hidden">
                        <img
                            src={fileObject.defaultUrl}
                            alt={'Unknown'}
                            className="h-full w-full object-cover object-top aspect-square"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
    return (
        <span>{label}</span>
    );
}
