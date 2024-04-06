import React from 'react';
import {Link} from "react-router-dom";
import {Button, ButtonProps} from '@/components/ui/button';
import {cn} from '@/utils/ComponentsUtils';
import {ErrorBadge} from '@/components/utils/ErrorBadge';

type NavigationButtonLinkProps = ButtonProps & {
    to: string;
    label: string;
    icon?: React.ReactNode;
    isError?: boolean;
}

export const NavigationButtonLink = React.forwardRef<HTMLButtonElement, NavigationButtonLinkProps>(
    ({
         to,
         label,
         icon,
         isError,
         variant,
         ...rest
     }: NavigationButtonLinkProps,
     ref
    ) => {
        return (
            <Button
                {...rest}
                ref={ref}
                variant={variant || 'ghost'}
                asChild={true}
                size="sm"
            >
                <Link to={to}>
                    {icon}
                    <ErrorBadge isError={!!isError}>
                        <span className={cn('whitespace-nowrap', {'ml-2': !!icon})}>{label}</span>
                    </ErrorBadge>
                </Link>
            </Button>
        );
    });
