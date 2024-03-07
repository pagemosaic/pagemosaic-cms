import {useRef, useState, useEffect, useCallback,} from 'react';
import {ClientController, get} from '@/utils/ClientApi';
import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';

export type GetDataStatus = 'idle' | 'loading' | 'error';

export interface GetDataOptions {
    skip?: boolean;
    interval?: number;
}

export interface State<T> {
    status: GetDataStatus;
    data: T | null;
    error?: string;
}

export interface GetDataResponse<T> extends State<T> {
    refresh: () => void;
}

export function useGetData<T>(url: string, options?: GetDataOptions): GetDataResponse<T> {
    const skip = options?.skip || false;
    const interval = options?.interval || 0;
    const mountedRef = useRef<boolean>(false);
    const controllerRef = useRef<ClientController>();
    const [stateObject, setStateObject] = useState<State<T>>({
        data: null, status: 'idle', error: undefined
    });

    const abortLoading = useCallback(() => {
        if (controllerRef.current) {
            controllerRef.current.abort();
        }
    }, []);

    const refresh = useCallback(() => {
        getData();
    }, []);

    const getData = useCallback(() => {
        abortLoading();
        setStateObject({status: 'loading', data: null, error: undefined});
        accessTokenSingleton.getAccessToken()
            .then((accessToken: AccessToken) => {
                if (!accessToken) {
                    throw Error('Missing access token');
                }
                return get<T>(url, accessToken, (controller) => {
                    controllerRef.current = controller;
                });
            })
            .then((data: T | null) => {
                setStateObject({status: 'idle', data, error: undefined});
            })
            .catch((e: any) => {
                setStateObject({status: 'error', data: null, error: e.message});
            })
            .finally(() => {
                controllerRef.current = undefined;
            });
    }, []);

    useEffect(() => {
        if (skip) {
            return;
        }
        if (!mountedRef.current) {
            mountedRef.current = true;
            getData();
        }
        let intervalId: NodeJS.Timeout;
        if (interval > 0) {
            intervalId = setInterval(getData, interval);
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            abortLoading();
        };
    }, [skip, interval]);

    return {...stateObject, refresh};
}
