import React from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {ScrollArea, ScrollBar} from '@/components/ui/scroll-area';
import {Toggle} from '@/components/ui/toggle';
import {Button} from '@/components/ui/button';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';

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

    const positions: Array<string> = Array.from({ length }, (_, index) => (index + 1).toString());

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <TooltipWrapper text="Change the position of the item in the list">
                <PopoverTrigger asChild>
                    <Button variant="outline" size="xs" className="text-xs font-semibold">{positions[index]}</Button>
                </PopoverTrigger>
            </TooltipWrapper>
            <PopoverContent className="w-[400px] flex flex-col gap-2">
                <p className="text-muted-foreground text-xs">Choose position for {label}</p>
                <ScrollArea className="w-full grow whitespace-nowrap">
                    <div className="flex flex-row gap-2 mb-2">
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
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}