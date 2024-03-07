import React, {useState, useEffect, useRef} from 'react';

interface DelayedLoadingProps {
    isLoading: boolean;
    loadingElement: React.ReactNode;
    element: React.ReactNode;
}

export function DelayedLoading({isLoading, loadingElement, element}: DelayedLoadingProps) {
    const [show, setShow] = useState(false);
    const timeoutRef = useRef<any>();

    const clear = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
    };

    useEffect(() => {
        if (isLoading) {
            timeoutRef.current = setTimeout(() => setShow(true), 300);
        } else {
            clear();
            setShow(false);
        }
        return () => {
            clear();
        }
    }, [isLoading]);

    if (show) {
        return loadingElement;
    }
    return element;
}
