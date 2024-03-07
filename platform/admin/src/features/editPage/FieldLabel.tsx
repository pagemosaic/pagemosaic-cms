import React from 'react';
import {LucideHelpCircle} from 'lucide-react';
import {Label} from '@/components/ui/label';
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover';
import {ButtonAction} from '@/components/utils/ButtonAction';

export function FieldLabel({label, field, help}: {label: string; field?: string, help?: string}) {
    return (
        <Label className="flex flex-row gap-2 items-center text-muted-foreground relative font-semibold" htmlFor={field}>
            <span className="absolute -left-[13px] top-[calc(50%-3px)] w-[5px] h-[5px] bg-slate-400 rounded-full" />
            {label}
            {help && (
                <Popover>
                    <PopoverTrigger asChild>
                        <ButtonAction Icon={LucideHelpCircle} variant="ghost" size="xxs" />
                    </PopoverTrigger>
                    <PopoverContent side="right" sideOffset={5} arrowPadding={20} className="w-80 bg-amber-50">
                        <div className="text-sm" dangerouslySetInnerHTML={{__html: help}} />
                    </PopoverContent>
                </Popover>
            )}
        </Label>
    );
}