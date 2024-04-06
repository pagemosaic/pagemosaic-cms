import React, {useMemo, useEffect} from 'react';
import {defer, Outlet, useLoaderData, Await, LoaderFunctionArgs, redirect} from 'react-router-dom';
import {MainNavigation} from '@/roots/main/MainNavigation';
import {AwaitError} from '@/components/utils/AwaitError';
import {DelayedFallback} from '@/components/utils/DelayedFallback';
import {sysUserDataSingleton, SysUserDataRequest} from '@/data/SysUserData';
import {AccessTokenRequest, accessTokenSingleton} from '@/utils/AccessTokenSingleton';
import {ToolbarSection} from '@/components/layouts/ToolbarSection';
import {MainSection} from '@/components/layouts/MainSection';
import {SystemInfoDataRequest, systemInfoDataSingleton} from '@/data/SystemInfoData';
import {SystemInfoProvider} from '@/data/useSystemInfo';
import {RestoreProvider} from '@/roots/main/RestoreProvider';
import {getSessionState} from '@/utils/localStorage';

export interface MainRouteLoaderResponse {
    accessTokenRequest: AccessTokenRequest;
    sysUserDataRequest: SysUserDataRequest;
    systemInfoDataRequest: SystemInfoDataRequest;
}

export async function mainLoader() {
    const accessTokenRequest = accessTokenSingleton.getAccessToken();
    const sysUserDataRequest = sysUserDataSingleton.getData();
    const systemInfoDataRequest = systemInfoDataSingleton.getData();
    return defer({
        accessTokenRequest,
        sysUserDataRequest,
        systemInfoDataRequest
    });
}

export async function mainAction({request}: LoaderFunctionArgs) {
    switch (request.method) {
        case "POST": {
            let formData = await request.formData();
            const action = formData.get('action');
            if (action === 'logout') {
                await sysUserDataSingleton.clearData();
                accessTokenSingleton.clearAccessToken();
                return redirect('/login');
            }
            break;
        }
        default: {
            throw new Response("", {status: 405});
        }
    }
}

export function MainRoute() {
    const {accessTokenRequest, sysUserDataRequest, systemInfoDataRequest} = useLoaderData() as MainRouteLoaderResponse;

    const handleConfirmOnExit = (e: BeforeUnloadEvent) => {
        if (getSessionState<boolean>('thereAreChanges')) {
            e.preventDefault();
            e.returnValue = '';
        }
    };

    useEffect(() => {
        window.addEventListener('beforeunload', handleConfirmOnExit);
        return () => {
            window.removeEventListener('beforeunload', handleConfirmOnExit);
        };
    }, []);

    const complexDefer = useMemo(() => {
        return Promise.all([accessTokenRequest, sysUserDataRequest, systemInfoDataRequest]);
    }, [accessTokenRequest, sysUserDataRequest, systemInfoDataRequest]);

    return (
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
            <React.Suspense fallback={<DelayedFallback/>}>
                <Await
                    resolve={complexDefer}
                    errorElement={<AwaitError/>}
                >
                    {([_1, _2, systemInfoData]) => {

                        return (
                            <SystemInfoProvider systemInfoData={systemInfoData}>
                                <ToolbarSection>
                                    <RestoreProvider>
                                        <MainNavigation/>
                                    </RestoreProvider>
                                </ToolbarSection>
                                <MainSection>
                                    <Outlet/>
                                </MainSection>
                            </SystemInfoProvider>
                        );
                    }}
                </Await>
            </React.Suspense>
        </div>
    );
}
