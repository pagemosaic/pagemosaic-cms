import React from 'react';
import {useNavigate} from 'react-router-dom';
import {
    LucideBookOpen,
    LucideFiles,
    LucideLayoutDashboard,
    LucideGlobe,
    LucideUploadCloud,
    LucideChevronDown,
    LucideGalleryHorizontalEnd
} from 'lucide-react';
import {PLATFORM_STACK_NAME} from 'infra-common/constants';
import {MainAccountNavigation} from '@/roots/main/MainAccountNavigation';
import {NavigationButtonLink} from '@/components/utils/NavigationButtonLink';
import {useSystemInfo} from '@/data/useSystemInfo';
import {useRestore} from '@/roots/main/RestoreProvider';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {useSessionState} from '@/utils/localStorage';

export function MainNavigation() {
    const navigate = useNavigate();
    const {platformWebsiteUrl} = useSystemInfo();
    const {showDialog} = useRestore();
    const {value: thereAreChanges} = useSessionState<boolean>('thereAreChanges');
    const publicUrl = platformWebsiteUrl?.entryPointDomainAlias
        ? `https://${platformWebsiteUrl?.entryPointDomainAlias || ''}`
        : `https://${platformWebsiteUrl?.entryPointDomain || ''}`;

    return (
        <div className="flex flex-row justify-between items-center px-4 py-2">
            <div className="flex flex-row gap-2 items-center">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" width="44" height="44" viewBox="0 0 24 24" strokeWidth="2"
                         fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/>
                        <path d="M10 4l4 16"/>
                        <path d="M12 12l-8 2"/>
                    </svg>
                </div>
                <a className="text-xl hover:underline text-blue-600" href={publicUrl} target="_blank">
                    {PLATFORM_STACK_NAME}
                </a>
            </div>
            <div className="flex flex-row items-center gap-2">
                <NavigationButtonLink
                    to="/pages"
                    label="Pages"
                    className="w-full justify-start"
                    icon={<LucideBookOpen className="h-4 w-4"/>}
                    isError={!!thereAreChanges}
                />
                <NavigationButtonLink
                    to="/files"
                    label="Files"
                    className="w-full justify-start"
                    icon={<LucideFiles className="h-4 w-4"/>}
                />
                <NavigationButtonLink
                    to="/"
                    label="Dashboard"
                    className="w-full justify-start"
                    icon={<LucideLayoutDashboard className="h-4 w-4"/>}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="justify-start"
                        >
                            <span>Administration</span>
                            <LucideChevronDown className="w-4 h-4 ml-2"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" collisionPadding={{top: 10, right: 10}}>
                        <DropdownMenuItem
                            className="flex flex-row gap-2 items-center"
                            onSelect={() => navigate('/edit-domain')}
                        >
                            <LucideGlobe className="h-4 w-4"/>
                            <div>Website Address Settings</div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="flex flex-row gap-2 items-center"
                            onSelect={() => showDialog({})}
                        >
                            <LucideUploadCloud className="h-4 w-4"/>
                            <div>Restore from Backup</div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="flex flex-row gap-2 items-center"
                            onSelect={() => navigate('/gallery')}
                        >
                            <LucideGalleryHorizontalEnd className="h-4 w-4"/>
                            <div>Templates Gallery</div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <MainAccountNavigation/>
            </div>
        </div>
    );
}
