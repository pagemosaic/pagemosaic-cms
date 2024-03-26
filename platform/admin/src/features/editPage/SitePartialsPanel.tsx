import React from 'react';
import debounce from 'lodash-es/debounce';
import set from 'lodash-es/set';
import {DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {Card} from '@/components/ui/card';
import {getSessionState, setSessionState, useSessionState} from '@/utils/localStorage';
import {CodeEditorHtml} from '@/components/utils/CodeEditorHtml';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';
import {SitePartialsSelect} from '@/features/editPage/SitePartialsSelect';

interface SitePartialsPanelProps {
    siteSessionStateKey: string;
    isInAction?: boolean;
}

export function SitePartialsPanel(props: SitePartialsPanelProps) {
    const {siteSessionStateKey, isInAction} = props;
    const {toggleHelp} = useHelpSheet();
    const {value: selectedPartialIndex = -1} = useSessionState<number>('siteSelectedPartialIndex');

    const debouncedOnChange = debounce((newValue: string) => {
        const siteEntry: DI_SiteEntry | undefined = getSessionState<DI_SiteEntry>(siteSessionStateKey);
        if (siteEntry && selectedPartialIndex >= 0) {
            set<string>(siteEntry, `SitePartials.${selectedPartialIndex}.SitePartialContentData.S`, newValue);
            set<string>(siteEntry, 'Entry.EntryUpdateDate.N', Date.now().toString());
            setSessionState(siteSessionStateKey, siteEntry);
        }
    }, 800);

    const handleChange = (code: string) => {
        debouncedOnChange(code);
    };

    const siteEntry: DI_SiteEntry | undefined = getSessionState<DI_SiteEntry>(siteSessionStateKey);

    return (
        <Card className="w-full h-full overflow-hidden">
            {selectedPartialIndex >= 0
                ? (
                    <CodeEditorHtml
                        key={`sitePartial_${siteEntry?.SitePartials[selectedPartialIndex].SitePartialKey.S}`}
                        stateKey={`sitePartial_${siteEntry?.SitePartials[selectedPartialIndex].SitePartialKey.S}`}
                        readOnly={isInAction}
                        withSuggestions={false}
                        code={siteEntry?.SitePartials[selectedPartialIndex].SitePartialContentData.S || ''}
                        onChange={handleChange}
                        onHelp={toggleHelp}
                        toolbar={<SitePartialsSelect siteSessionStateKey={siteSessionStateKey} />}
                    />
                )
                : (
                    <div className="w-full h-full grid place-items-center">
                        <SitePartialsSelect siteSessionStateKey={siteSessionStateKey} />
                    </div>
                )
            }
        </Card>
    );
}
