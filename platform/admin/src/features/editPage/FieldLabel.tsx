import React from 'react';
import {LucideHelpCircle, LucideChevronDown, LucideChevronRight} from 'lucide-react';
import {Label} from '@/components/ui/label';
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover';
import {ButtonAction} from '@/components/utils/ButtonAction';

interface FieldLabelProps {
    label: string;
    field?: string;
    help?: string;
    composite?: boolean;
    nested?: boolean;
    collapsed?: boolean;
    controls?: React.ReactNode;
    className?: string;
    onToggle?: () => void;
}

export function FieldLabel(props: FieldLabelProps) {
    const {label, field, help, composite, nested, collapsed, controls, className = '', onToggle} = props;
    let iconElement = null;
    if (composite) {
        iconElement = (
            <span className="absolute -left-[20px] top-[0.2em]">
                {collapsed
                    ? (<LucideChevronRight className="h-[1em] w-[1em]" />)
                    : (<LucideChevronDown className="h-[1em] w-[1em]" />)
                }
            </span>
        );
    } else if (nested) {
        iconElement = (<span className="absolute -left-[24px] top-[calc(50%-1px)] w-[20px] border-t-[2px] border-dotted border-slate-300" />);
    } else {
        iconElement = (<span className="absolute -left-[13px] top-[calc(50%-3px)] w-[5px] h-[5px] bg-slate-400 rounded-full" />);
    }
    return (
        <Label className={`flex flex-row gap-2 items-center text-muted-foreground relative font-semibold ${className}`} htmlFor={field}>
            {iconElement}
            {composite ? <span className="hover:underline cursor-pointer" onClick={onToggle}>{label}</span> : label}
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