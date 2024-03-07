import React from 'react';
import {LucidePlus} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {ContentDataConfigClass} from 'infra-common/data/ContentDataConfig';
import {ButtonAction} from '@/components/utils/ButtonAction';

interface ContentDataBlockAddButtonProps {
    blockRecords: ContentDataConfigClass;
    onSelect: (contentDataBlockClassKey: string) => void;
}

export const ContentDataBlockAddButton = React.forwardRef<HTMLButtonElement, ContentDataBlockAddButtonProps>((props: ContentDataBlockAddButtonProps, ref) => {
    const {blockRecords, onSelect} = props;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <ButtonAction
                    ref={ref}
                    Icon={LucidePlus}
                    size="xxs"
                    disabled={Object.entries(blockRecords).length === 0}
                    variant="outline"
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent collisionPadding={{top: 10, right: 10}}>
                {Object.entries(blockRecords).map((entry) => {
                    return (
                        <DropdownMenuItem
                            key={entry[0]}
                            onSelect={() => {
                                onSelect(entry[0]);
                            }}
                        >
                            <div>Add {entry[1].label}</div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
});
