import React, {ReactNode, useContext, useState} from 'react';

export type AsyncStatus = {
    isUninitialized?: boolean;
    isLoading?: boolean;
    loadingProgress?: number;
    loadingTotal?: number;
    cancel?: () => void;
    isSuccess?: boolean;
    isError?: boolean;
    isAborted?: boolean;
    error?: string;
};

export type AsyncStatusProviderProps = {
    initialStatus?: AsyncStatus;
    children: ReactNode;
};

export const AsyncStatusContext = React.createContext<{
    status: AsyncStatus;
    setStatus: (status: AsyncStatus) => void;
} | null>(null);

export const AsyncStatusProvider: React.FC<AsyncStatusProviderProps> = (props) => {
    const { children, initialStatus } = props;

    // Using useState to manage the AsyncStatus
    const [state, setState] = useState<AsyncStatus>(initialStatus || { isUninitialized: true });

    // Method to update the state
    const setStatus = (status: AsyncStatus) => {
        setState(prevState => ({ ...status }));
    };

    return (
        <AsyncStatusContext.Provider value={{ status: state, setStatus }}>
            {children}
        </AsyncStatusContext.Provider>
    );
};

export const useAsyncStatus = () => {
    const context = useContext(AsyncStatusContext);
    if (!context) {
        throw new Error('useAsyncStatus must be used within a AsyncStatusProvider');
    }
    return context;
};
