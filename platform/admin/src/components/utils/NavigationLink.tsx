import React from 'react';
import {useMatch, useResolvedPath, Link} from "react-router-dom";
import {cn} from '@/utils/ComponentsUtils';

interface NavigationLinkProps {
    to: string;
    end?: boolean;
    className?: string;
    label: string;
    icon?: React.ReactNode;
}

export function NavigationLink({to, end = false, label, icon}: NavigationLinkProps) {
    // let resolved = useResolvedPath(to);
    let match = useMatch({ path: to, end });
    return (
        <Link
            to={to}
            className={cn("flex flex-row gap-2 items-center text-sm hover:underline disabled:pointer-events-none disabled:opacity-50 px-3 py-1", {
                ['font-normal']: !match,
                ['font-semibold']: match
            })}
        >
            {icon}
            <span className="whitespace-normal">{label}</span>
        </Link>
    );
}
