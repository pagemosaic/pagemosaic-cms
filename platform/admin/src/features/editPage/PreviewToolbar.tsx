import React from 'react';
import {LucideRefreshCw, LucideCircle, LucideCheckCircle} from 'lucide-react';
import {useSessionState} from '@/utils/localStorage';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {Toggle} from '@/components/ui/toggle';

export const RELOAD_PREVIEW_EVENT = 'reload_preview_event';

export function PreviewToolbar() {
    const {
        value: autoReloadPreview = true,
        saveValue: setAutoReloadPreview
    } = useSessionState<boolean>('autoReloadPreview');

    return (
        <div className="flex flex-row gap-2 items-center">
            <div>
                <ButtonAction
                    size="sm"
                    variant="ghost"
                    Icon={LucideRefreshCw}
                    label="Reload"
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent<void>(RELOAD_PREVIEW_EVENT));
                    }}
                />
            </div>
            <div className="flex items-center gap-2">
                <Toggle className="flex flex-row gap-2 items-center" size="sm" pressed={autoReloadPreview}
                        onClick={() => setAutoReloadPreview(!autoReloadPreview)}>
                    {autoReloadPreview
                        ? (<LucideCheckCircle className="w-4 h-4"/>)
                        : (<LucideCircle className="w-4 h-4"/>)
                    }
                    Auto
                </Toggle>
            </div>
        </div>
    );
}