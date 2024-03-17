import React from 'react';
import {LucideHelpCircle} from 'lucide-react';
import {Label} from '@/components/ui/label';
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover';
import {ButtonAction} from '@/components/utils/ButtonAction';

interface FieldLabelProps {
    label: string;
    field?: string;
    help?: string;
    nested?: boolean;
    controls?: React.ReactNode;
    className?: string;
}

export function FieldLabel(props: FieldLabelProps) {
    const {label, field, help, nested, controls, className = ''} = props;
    return (
        <Label className={`flex flex-row gap-2 items-center text-muted-foreground relative font-semibold ${className}`} htmlFor={field}>
            {nested
                ? (<span className="absolute -left-[24px] top-[calc(50%-1px)] w-[20px] border-t-[2px] border-dotted border-slate-300" />)
                : (<span className="absolute -left-[13px] top-[calc(50%-3px)] w-[5px] h-[5px] bg-slate-400 rounded-full" />)
            }
            {label}
            {controls}
            {help && (
                <Popover>
                    <PopoverTrigger asChild>
                        <ButtonAction Icon={LucideHelpCircle} variant="ghost" size="xxs" />
                    </PopoverTrigger>
                    <PopoverContent side="right" sideOffset={5} arrowPadding={20} className="w-80 bg-amber-50">
                        <div className="content-field-help text-sm" dangerouslySetInnerHTML={{__html: help}} />
                    </PopoverContent>
                </Popover>
            )}
        </Label>
    );
}