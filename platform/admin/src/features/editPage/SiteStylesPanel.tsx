import React from 'react';
import debounce from 'lodash-es/debounce';
import set from 'lodash-es/set';
import {Card} from '@/components/ui/card';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {getSessionState, setSessionState} from '@/utils/localStorage';
import {CodeEditorCss} from '@/components/utils/CodeEditorCss';
import {DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';

interface SiteStylesPanelProps {
    siteSessionStateKey: string;
    isInAction?: boolean;
    actionData: any;
}

export function SiteStylesPanel(props: SiteStylesPanelProps) {
    const {siteSessionStateKey, isInAction, actionData} = props;
    const {toggleHelp} = useHelpSheet();

    const siteEntry: DI_SiteEntry | undefined = getSessionState<DI_SiteEntry>(siteSessionStateKey);

    if (!siteEntry) {
        return (
            <div>
                <p>Missing Initial Data For Site Styles</p>
            </div>
        );
    }

    const debouncedOnChange = debounce((newValue: string) => {
        if (siteEntry) {
            siteEntry.SiteStyles = newValue;
            set<string>(siteEntry, 'Entry.EntryUpdateDate.N', Date.now().toString());
            setSessionState(siteSessionStateKey, siteEntry);
        }
    }, 800);

    const handleChange = (code: string) => {
        debouncedOnChange(code);
    };

    return (
        <Card className="w-full h-full overflow-hidden">
            <div className="h-full w-full flex flex-col gap-2">
                <ActionDataFieldError
                    actionData={actionData}
                    fieldName="Styles"
                />
                <CodeEditorCss
                    stateKey="siteCss"
                    readOnly={isInAction}
                    code={siteEntry.SiteStyles || ''}
                    onChange={handleChange}
                    onHelp={toggleHelp}
                />
            </div>
        </Card>
    );
}
