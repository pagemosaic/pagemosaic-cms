import React from 'react';

export function LeftSubSection({children}: {children: React.ReactNode}) {
    return (
        <div className="absolute top-0 left-0 w-[10em] bottom-0 overflow-hidden">
            {children}
        </div>
    );
}