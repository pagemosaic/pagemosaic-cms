import React from 'react';
import {LucideSearch, LucideIcon} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {usePagesBrowser} from '@/features/pages/PagesBrowserProvider';

interface BrowsePagesButtonProps {
    disabled?: boolean;
    label?: string;
    Icon?: LucideIcon;
    onSelect: (pageId: string) => void;
}

export function BrowsePagesButton(props: BrowsePagesButtonProps) {
    const {disabled = false, label = 'Select Page', Icon = LucideSearch, onSelect} = props;
    const {showDialog} = usePagesBrowser();

    const handleOnSelect = (pageId: string) => {
        onSelect(pageId);
    };

    return (
        <ButtonAction
            Icon={Icon}
            label={label}
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => {
                showDialog({
                    title: 'Pages',
                    onSelect: handleOnSelect
                });
            }}
        />
    );
}
