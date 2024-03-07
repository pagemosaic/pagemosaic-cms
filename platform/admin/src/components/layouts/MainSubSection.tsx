import React from 'react';

export function MainSubSection({children}: {children: React.ReactNode}) {
    return (
        <div className="absolute top-0 left-0 bottom-0 right-0">
            {children}
        </div>
    );
}
