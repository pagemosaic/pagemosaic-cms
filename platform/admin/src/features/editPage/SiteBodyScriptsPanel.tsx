import React from 'react';
import debounce from 'lodash-es/debounce';
import set from 'lodash-es/set';
import {DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {Card} from '@/components/ui/card';
import {getSessionState, setSessionState} from '@/utils/localStorage';
import {CodeEditorHtml} from '@/components/utils/CodeEditorHtml';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';

interface SiteBodyScriptsPanelProps {
    siteSessionStateKey: string;
    isInAction?: boolean;
    actionData: any;
}

export function SiteBodyScriptsPanel(props: SiteBodyScriptsPanelProps) {
    const {siteSessionStateKey, isInAction, actionData} = props;
    const {toggleHelp} = useHelpSheet();

    const siteEntry: DI_SiteEntry | undefined = getSessionState<DI_SiteEntry>(siteSessionStateKey);

    if (!siteEntry) {
        return (
            <div>
                <p>Missing Initial Data For Site Scripts</p>
            </div>
        );
    }

    const debouncedOnChange = debounce((newValue: string) => {
        if (siteEntry) {
            siteEntry.SiteBodyScripts = newValue;
            set<string>(siteEntry, 'Entry.EntryUpdateDate.N', Date.now().toString());
            setSessionState(siteSessionStateKey, siteEntry);
        }
    }, 800);

    const handleChange = (code: string) => {
        debouncedOnChange(code);
    };

    return (
        <Card className="w-full h-full overflow-hidden">
            <CodeEditorHtml
                stateKey="siteBodyScripts"
                readOnly={isInAction}
                withSuggestions={false}
                code={siteEntry.SiteBodyScripts || ''}
                onChange={handleChange}
                onHelp={toggleHelp}
            />
        </Card>
    );
}
