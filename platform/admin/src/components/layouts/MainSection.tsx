import React from 'react';

export function MainSection({children}: {children: React.ReactNode}) {
    return (
        <div className="absolute top-[53px] left-0 bottom-0 right-0 bg-gray-50">
            {children}
        </div>
    );
}
