import React, {useContext} from 'react';
import {SystemInfoData} from '@/data/SystemInfoData';

export interface SystemInfoProviderProps {
    children: React.ReactNode;
    systemInfoData: SystemInfoData;
}

export const SystemInfoContext = React.createContext<SystemInfoData>(null);

export function SystemInfoProvider(props: SystemInfoProviderProps) {
    const {children, systemInfoData} = props;
    return (
        <SystemInfoContext.Provider value={systemInfoData}>
            {children}
        </SystemInfoContext.Provider>
    );
}

export const useSystemInfo = () => {
    const context = useContext(SystemInfoContext);
    if (!context) {
        throw new Error('useSystemInfo must be used within a SystemInfoProvider');
    }
    return context;
};
