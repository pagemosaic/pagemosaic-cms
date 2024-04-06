import React from 'react';
import debounce from 'lodash-es/debounce';
import set from 'lodash-es/set';
import {Card} from '@/components/ui/card';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {getSessionState, setSessionState} from '@/utils/localStorage';
import {CodeEditorCss} from '@/components/utils/CodeEditorCss';
import {DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {getIdFromPK} from 'infra-common/utility/database';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';

interface ContentStylesPanelProps {
    templateSessionStateKey: string;
    isInAction?: boolean;
    actionData: any;
}

export function ContentStylesPanel(props: ContentStylesPanelProps) {
    const {templateSessionStateKey, isInAction, actionData} = props;
    const {toggleHelp} = useHelpSheet();
    const templateEntry: DI_TemplateEntry | undefined = getSessionState<DI_TemplateEntry>(templateSessionStateKey);

    if (!templateEntry) {
        return (
            <div>
                <p>Missing Initial Data For Content Styles</p>
            </div>
        );
    }

    const debouncedOnChange = debounce((newValue: string) => {
        if (templateEntry) {
            templateEntry.Styles = newValue;
            set<string>(templateEntry, 'Entry.EntryUpdateDate.N', Date.now().toString());
            setSessionState(templateSessionStateKey, templateEntry);
            setSessionState('thereAreChanges', true);
        }
    }, 800);

    const handleChange = (code: string) => {
        debouncedOnChange(code);
    };

    const templateId = getIdFromPK(templateEntry.Entry?.PK.S);

    return (
        <Card className="w-full h-full overflow-hidden">
            <div className="h-full w-full flex flex-col gap-2">
                <ActionDataFieldError
                    actionData={actionData}
                    fieldName="Styles"
                />
                <CodeEditorCss
                    stateKey={templateId}
                    readOnly={isInAction}
                    code={templateEntry.Styles || ''}
                    onChange={handleChange}
                    onHelp={toggleHelp}
                />
            </div>
        </Card>
    );
}
