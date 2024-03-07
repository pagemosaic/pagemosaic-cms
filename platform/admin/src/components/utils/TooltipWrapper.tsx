import React from 'react';
import {TooltipProvider, Tooltip, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip';

interface TooltipWrapperProps {
    text: string;
    delayDuration?: number;
    children: React.ReactNode;
}

export function TooltipWrapper(props: TooltipWrapperProps) {
    const {text, delayDuration = 2000, children} = props;
    return (
        <TooltipProvider>
            <Tooltip delayDuration={delayDuration}>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent className="bg-amber-100">
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}