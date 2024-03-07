import React from 'react';
import {useAsyncStatus} from '@/components/utils/AsyncStatusProvider';

export interface AsyncStatusErrorProps {
    className?: string;
}

export function AsyncStatusError(props: AsyncStatusErrorProps) {
    const {className} = props;
    const {status} = useAsyncStatus();
    if (status.isError) {
        return (
            <div className={className}>
                <p className="text-xs text-red-600">{status.error}</p>
            </div>
        );
    }
    return null;
}
