import React from 'react';
import {Button, ButtonProps} from '@/components/ui/button';
import {cn} from '@/utils/ComponentsUtils';

type NavigationButtonProps = ButtonProps & {
    label: string;
    icon?: React.ReactNode;
}

export const NavigationButton = React.forwardRef<HTMLButtonElement, NavigationButtonProps>(({label, icon, variant, ...rest}: NavigationButtonProps, ref) => {
    return (
        <Button
            {...rest}
            ref={ref}
            variant={variant || 'ghost'}
            size="sm"
        >
            {icon}
            <span className={cn('whitespace-nowrap', {'ml-2': !!icon})}>{label}</span>
        </Button>
    );
});
