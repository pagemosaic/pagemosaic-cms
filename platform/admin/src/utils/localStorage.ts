import localforage from 'localforage';
import {useEffect, useState} from 'react';
// import {SequentialTaskQueue} from 'sequential-task-queue';
//
// export const sessionStorageTaskQueue = new SequentialTaskQueue();
let storageInstance: LocalForage;
const SESSION_STORAGE_SET_EVENT = 'session_storage_set';
const SESSION_STORAGE_DEL_EVENT = 'session_storage_del';

export type SessionStorageEvent = {
    key: string;
};

export function getSessionState<T>(key: string): T | undefined {
    let result: T | undefined = undefined;
    let stringValue: string | null = sessionStorage.getItem(key);
    if (stringValue) {
        try {
            result = JSON.parse(stringValue);
        } catch (e: any) {
            console.error(`Error reading session storage ${key}. ${e.message}`);
        }
    }
    return result;
}

export function setSessionState(key: string, val: any): void {
    sessionStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new CustomEvent<SessionStorageEvent>(SESSION_STORAGE_SET_EVENT, {
        detail: {key}
    }));
}

export function delSessionState(key: string): void {
    sessionStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent<SessionStorageEvent>(SESSION_STORAGE_DEL_EVENT, {
        detail: {key}
    }));
}

export function clearSessionState(): void {
    sessionStorage.clear();
}

// export async function keysGlobalState() {
//   return (await dbPromise).getAllKeys('globalState');
// }

export function initStorage() {
    localforage.config({
        name: 'PageMosaicAdminPanel'
    });
}

export function getStorageInstance() {
    if (!storageInstance) {
        initStorage();
        storageInstance = localforage.createInstance({
            name: 'PageMosaicAdminPanelStorage',
        });
    }
    return storageInstance;
}

export async function setStorageRecord(recordObjectKey: string, recordObject: any, storageKey: string): Promise<void> {
    return getStorageInstance().getItem(storageKey)
        .then((record: any) => {
            record = record || {};
            record[recordObjectKey] = recordObject;
            return getStorageInstance().setItem(storageKey, record);
        });
}

export async function getStorageRecord(recordObjectKey: string, storageKey: string): Promise<any> {
    return getStorageInstance().getItem(storageKey)
        .then((record: any) => {
            record = record || {};
            return record[recordObjectKey];
        });
}

export function useSessionState<T>(key: string) {
    const [value, setValue] = useState<T | undefined>(getSessionState<T>(key));
    const eventHandler = (event: Event) => {
        const {detail: {key: eventKey}} = event as CustomEvent<SessionStorageEvent>;
        if (key === eventKey) {
            // console.log('Session storage changed!');
            setValue(getSessionState<T>(key));
        }
    };
    useEffect(() => {
        window.addEventListener(SESSION_STORAGE_SET_EVENT, eventHandler);
        return () => {
            window.removeEventListener(SESSION_STORAGE_SET_EVENT, eventHandler);
        };
    }, []);
    useEffect(() => {
        setValue(getSessionState<T>(key));
    }, [key]);
    return {
        value,
        saveValue: (newValue: T) => setSessionState(key, newValue)
    };
}
