import React from 'react';
import {LucideSearch} from 'lucide-react';
import {usePublicFilesBrowser} from '@/features/filesFinder/PublicFilesBrowserProvider';
import {ButtonAction} from '@/components/utils/ButtonAction';

interface BrowseFilesButtonProps {
    disabled?: boolean;
    onSelect: (url: string) => void;
}

export function BrowseFilesButton(props: BrowseFilesButtonProps) {
    const {disabled = false, onSelect} = props;
    const {showDialog} = usePublicFilesBrowser();

    const handleOnSelect = (url: string) => {
        onSelect(url);
    };

    return (
        <ButtonAction
            Icon={LucideSearch}
            label="Select Image"
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => {
                showDialog({
                    title: 'Images',
                    onSelect: handleOnSelect
                });
            }}
        />
    );
}
