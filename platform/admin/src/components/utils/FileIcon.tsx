import {
    LucideIcon,
    LucideFileImage,
    LucideFileVideo,
    LucideFileText,
    LucideFileArchive,
    LucideFile
} from 'lucide-react';
import React from 'react';

const fileTypesMap: Record<string, LucideIcon> = {
    'png': LucideFileImage,
    'jpg': LucideFileImage,
    'jpeg': LucideFileImage,
    'webp': LucideFileImage,
    'avif': LucideFileImage,
    'gif': LucideFileImage,
    'mov': LucideFileVideo,
    'avi': LucideFileVideo,
    'pdf': LucideFileText,
    'zip': LucideFileArchive,
};

export function FileIcon({fileName}: { fileName: string }) {
    const fileExt = fileName.split('.').pop();
    let FoundIcon: LucideIcon = fileExt
        ? fileTypesMap[fileExt] || LucideFile
        : LucideFile;
    return <FoundIcon className="w-4 h-4"/>
}
