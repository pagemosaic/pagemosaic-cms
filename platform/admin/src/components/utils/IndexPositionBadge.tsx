import React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {Toggle} from '@/components/ui/toggle';
import {Button} from '@/components/ui/button';

interface IndexPositionBadgeProps {
    index: number;
    length: number;
    label: string;
    onSelect: (index: number) => void;
}

export function IndexPositionBadge(props: IndexPositionBadgeProps) {
    const {index, length, label, onSelect} = props;
    const [open, setOpen] = React.useState(false);


    const handleSelect = (selectedIndex: number) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect(selectedIndex);
        setOpen(false);
    };

    const positions: Array<string> = Array.from({length}, (_, index) => (index + 1).toString());

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild onClick={e => e.stopPropagation()}>
                <Button variant="outline" title={`Choose position for ${label}`} size="xs" className="text-xs font-semibold">{positions[index]}</Button>
            </PopoverTrigger>
            <PopoverContent onClick={e => { e.stopPropagation(); e.preventDefault(); }}>
                <div className="flex-grow flex flex-row gap-2 mb-2 flex-wrap">
                    {positions.map((position, positionIndex) => {
                        return (
                            <div key={position}>
                                <Toggle
                                    defaultValue={positionIndex}
                                    pressed={index === positionIndex}
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelect(positionIndex)}
                                >
                                    <span className="font-semibold text-sm">{position}</span>
                                </Toggle>
                            </div>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}