import React from 'react';
import {Await, useRouteLoaderData, useFetcher} from 'react-router-dom';
import {LucideUserCircle} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {AwaitError} from '@/components/utils/AwaitError';
import {MainRouteLoaderResponse} from '@/roots/main/Main.route';
import {SysUserData} from '@/data/SysUserData';

export function MainAccountNavigation() {
    const {sysUserDataRequest} = useRouteLoaderData('main') as MainRouteLoaderResponse;
    const fetcher = useFetcher();
    return (
        <div>
            <React.Suspense
                fallback={
                    <Button size="sm" variant="ghost" className="w-full justify-start" disabled>
                        Loading...
                    </Button>
                }
            >
                <Await
                    resolve={sysUserDataRequest}
                    errorElement={<AwaitError />}
                >
                    {(sysUserData: SysUserData) => (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="w-full justify-start">
                                    <LucideUserCircle className="h-4 w-4" strokeWidth={1.5} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent collisionPadding={{top: 10, right: 10}} className="w-56">
                                <DropdownMenuLabel>{sysUserData.userAttributes?.email || 'undefined'}</DropdownMenuLabel>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        fetcher.submit(
                                            { action: 'logout' },
                                            { method: "post" }
                                        )
                                    }}
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </Await>
            </React.Suspense>
        </div>
    );
}
