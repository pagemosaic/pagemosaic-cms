import React from 'react';
import {Button, ButtonProps} from '@/components/ui/button';
import {LucideIcon, LucideRefreshCw} from 'lucide-react';

type ButtonActionProps = ButtonProps & {
    label?: string;
    Icon?: LucideIcon;
    isLoading?: boolean;
}

export const ButtonAction = React.forwardRef<HTMLButtonElement, ButtonActionProps>(({label, Icon, isLoading, disabled, size, ...rest}: ButtonActionProps, ref) => {
    let iconClassSizing = 'w-4 h-4';
    if (size === 'xxs') {
        iconClassSizing = 'w-3 h-3';
    } else if (size === 'xs') {
        iconClassSizing = 'w-3 h-3';
    }

    return (
        <Button
            {...rest}
            size={size}
            ref={ref}
            disabled={!!isLoading || disabled}
        >
            {isLoading
                ? (
                    <div className="flex flex-row gap-2 items-center">
                        {Icon && (<LucideRefreshCw className={`${iconClassSizing} animate-spin`}/>)}
                        {label && (<span className="whitespace-nowrap">{label}</span>)}
                    </div>
                )
                : (
                    <div className="flex flex-row gap-2 items-center">
                        {Icon && (<Icon className={iconClassSizing}/>)}
                        {label && (<span className="whitespace-nowrap">{label}</span>)}
                    </div>
                )
            }
        </Button>
    );
});
