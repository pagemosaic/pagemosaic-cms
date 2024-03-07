import React from 'react';

export function CentralSubSection({children}: {children: React.ReactNode}) {
    return (
        <div className="absolute top-0 left-[10em] bottom-0 right-0 overflow-hidden">
            {children}
        </div>
    );
}
