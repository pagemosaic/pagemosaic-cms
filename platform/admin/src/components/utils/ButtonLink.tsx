import React from 'react';
import {Link} from "react-router-dom";
import {Button, ButtonProps} from '@/components/ui/button';
import {LucideIcon, LucideRefreshCw} from 'lucide-react';

type ButtonLinkProps = ButtonProps & {
    to: string;
    label?: string;
    target?: string;
    Icon: LucideIcon;
    isLoading?: boolean;
    state?: any;
}

export const ButtonLink = React.forwardRef<HTMLButtonElement, ButtonLinkProps>(({to, label, Icon, isLoading, disabled, target, state, ...rest}: ButtonLinkProps, ref) => {
    return (
        <Button
            {...rest}
            ref={ref}
            disabled={!!isLoading || disabled}
            asChild={!isLoading}
        >
            {isLoading
                ? (
                    <div className="flex flex-row gap-2 items-center">
                        <LucideRefreshCw className="w-4 h-4 animate-spin"/>
                        {label && <span className="whitespace-nowrap">{label}</span>}
                    </div>
                )
                : (
                    <Link to={to} state={state} target={target}>
                        <div className="flex flex-row gap-2 items-center">
                            <Icon className="w-4 h-4"/>
                            {label && <span className="whitespace-nowrap">{label}</span>}
                        </div>
                    </Link>
                )
            }
        </Button>
    );
});
