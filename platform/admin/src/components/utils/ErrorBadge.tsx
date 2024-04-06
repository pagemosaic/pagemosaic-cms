import React from 'react';

export interface ErrorBadgeProps {
    isError: boolean;
    children: React.ReactNode;
}

export function ErrorBadge(props: ErrorBadgeProps) {
    const {isError, children} = props;
    if (isError) {
        return (
            <div className="relative">
                <div className="absolute -top-[5px] -right-[5px] w-[10px] h-[10px] rounded-full bg-red-600"/>
                {children}
            </div>
        );
    }
    return children;
}
