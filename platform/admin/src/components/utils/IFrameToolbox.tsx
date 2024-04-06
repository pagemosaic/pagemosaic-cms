import React, {useEffect, useState} from 'react';
import {LucideZoomIn, LucideZoomOut} from 'lucide-react';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {useSessionState} from '@/utils/localStorage';
import {IFrameExtendedEvent, IFRAME_RESIZE_EVENT} from '@/components/utils/IFrameExtended';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';

interface IFrameToolboxProps {
    title?: string;
}

export function IFrameToolbox(props: IFrameToolboxProps) {
    const {title} = props;
    const {value: scale = 0.8, saveValue: setScale} = useSessionState<number>('iFrameScale');
    const [width, setWidth] = useState<number>(0);

    function handleIFrameWidthChange(event: Event): void {
        const {detail: {iframeWidth}} = event as CustomEvent<IFrameExtendedEvent>;
        setWidth(Number(iframeWidth));
    }

    useEffect(() => {
        console.log('Bind listener IFRAME_RESIZE_EVENT');
        window.addEventListener(IFRAME_RESIZE_EVENT, handleIFrameWidthChange, false);
        return () => {
            console.log('Unbind listener IFRAME_RESIZE_EVENT');
            window.removeEventListener(IFRAME_RESIZE_EVENT, handleIFrameWidthChange, false);
        };
    }, []);

    return (
        <div className="flex flex-row gap-2 items-center">
            {title && (width * scale) > 500 && (
                <TooltipWrapper delayDuration={500} text={title}>
                    <div
                        className="text-sm max-w-[300px] line-clamp-1 px-2 py-[0.1em] border-slate-200 rounded-[6px] border-[1px] bg-slate-100">
                        <span>{title}</span>
                    </div>
                </TooltipWrapper>
            )}
            <div className="px-2 py-[0.1em] border-slate-200 rounded-[6px] border-[1px] text-sm bg-slate-100">
                {width}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="px-2 py-[0.1em] border-slate-200 rounded-[6px] border-[1px] text-sm bg-slate-100 flex flex-row gap-2 items-center cursor-pointer">
                        {scale >= 1
                            ? (<LucideZoomIn className="w-3 h-3" />)
                            : (<LucideZoomOut className="w-3 h-3" />)
                        }
                        {scale}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent collisionPadding={{top: 10, right: 10}}>
                    <DropdownMenuItem onSelect={() => {
                        setScale(0.5)
                    }}>
                        <div>Zoom out x0.5</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => {
                        setScale(0.8)
                    }}>
                        <div>Zoom out x0.8</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => {
                        setScale(1)
                    }}>
                        <div>Reset zoom</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => {
                        setScale(1.2)
                    }}>
                        <div>Zoom in x1.2</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => {
                        setScale(1.5)
                    }}>
                        <div>Zoom in x1.5</div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => {
                        setScale(2)
                    }}>
                        <div>Zoom in x2</div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
