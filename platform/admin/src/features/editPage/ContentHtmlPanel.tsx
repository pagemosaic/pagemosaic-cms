import React from 'react';
import debounce from 'lodash-es/debounce';
import set from 'lodash-es/set';
import {DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {Card} from '@/components/ui/card';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {getSessionState, setSessionState} from '@/utils/localStorage';
import {CodeEditorHtml} from '@/components/utils/CodeEditorHtml';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';
import {getIdFromPK} from 'infra-common/utility/database';

interface ContentHtmlPanelProps {
    templateSessionStateKey: string;
    isInAction?: boolean;
    actionData: any;
}

export function ContentHtmlPanel(props: ContentHtmlPanelProps) {
    const {templateSessionStateKey, isInAction, actionData} = props;
    const {toggleHelp} = useHelpSheet();

    const templateEntry: DI_TemplateEntry | undefined = getSessionState<DI_TemplateEntry>(templateSessionStateKey);

    if (!templateEntry) {
        return (
            <div>
                <p>Missing Initial Data For Html</p>
            </div>
        );
    }

    const debouncedOnChange = debounce((newValue: string) => {
        if (templateEntry) {
            templateEntry.Html = newValue;
            set<string>(templateEntry, 'Entry.EntryUpdateDate.N', Date.now().toString());
            setSessionState(templateSessionStateKey, templateEntry);
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
                    fieldName="Html"
                />
                <CodeEditorHtml
                    stateKey={templateId}
                    readOnly={isInAction}
                    code={templateEntry.Html || ''}
                    onChange={handleChange}
                    onHelp={toggleHelp}
                />
            </div>
        </Card>
    );
}
