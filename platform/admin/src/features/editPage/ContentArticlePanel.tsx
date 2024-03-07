import React, {useRef} from 'react';
import debounce from 'lodash-es/debounce';
import {DI_PageEntry} from 'infra-common/data/DocumentItem';
import {Card} from '@/components/ui/card';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {getSessionState, setSessionState} from '@/utils/localStorage';
import {CodeEditorMarkdown, CodeEditorMarkdownHandle} from '@/components/utils/CodeEditorMarkdown';
import {usePublicFilesBrowser} from '@/features/filesFinder/PublicFilesBrowserProvider';
import {usePagesBrowser} from '@/features/pages/PagesBrowserProvider';
import {useHelpSheet} from '@/features/helpSheet/HelpSheetProvider';
import {getIdFromPK} from 'infra-common/utility/database';

interface ContentArticlePanelProps {
    pageSessionStateKey: string;
    isInAction?: boolean;
    actionData: any;
}

export function ContentArticlePanel(props: ContentArticlePanelProps) {
    const {pageSessionStateKey, isInAction, actionData} = props;
    const {showDialog: showPublicFilesBrowser} = usePublicFilesBrowser();
    const {showDialog: showPagesBrowser} = usePagesBrowser();
    const {toggleHelp} = useHelpSheet();
    const codeEditorRef = useRef<CodeEditorMarkdownHandle>(null);

    const pageEntry: DI_PageEntry | undefined = getSessionState<DI_PageEntry>(pageSessionStateKey);

    if (!pageEntry) {
        return (
            <div>
                <p>Missing Initial Data For Article</p>
            </div>
        );
    }

    const {Entry, Article} = pageEntry;

    const debouncedOnChange = debounce((newValue: string) => {
        if (Entry && Article) {
            Entry.EntryUpdateDate.N = Date.now().toString();
            Article.PageArticleData.S = newValue || '';
            setSessionState(pageSessionStateKey, pageEntry);
        }
    }, 800);

    const handleChange = (code: string) => {
        debouncedOnChange(code);
    };

    const handleAddImage = () => {
        showPublicFilesBrowser({
            title: 'Images',
            onSelect: (url: string) => {
                if (codeEditorRef.current) {
                    codeEditorRef.current.insertTextAtCursor(`![Alt Text](${url})`, 'Alt Text');
                    setTimeout(() => {codeEditorRef.current?.setFocus();}, 200);
                }
            }
        });
    };

    const handleAddLink = () => {
        showPagesBrowser({
            title: 'Pages',
            onSelect: (_, url, pageTitle) => {
                if (codeEditorRef.current) {
                    codeEditorRef.current.insertTextAtCursor(`[${pageTitle}](${url})`, pageTitle);
                    setTimeout(() => {codeEditorRef.current?.setFocus();}, 200);
                }
            }
        });
    };

    return (
        <Card className="w-full h-full overflow-hidden">
            <div className="h-full w-full flex flex-col gap-2">
                <ActionDataFieldError
                    actionData={actionData}
                    fieldName="Article"
                />
                <CodeEditorMarkdown
                    stateKey={getIdFromPK(pageEntry.Entry?.PK.S)}
                    ref={codeEditorRef}
                    readOnly={isInAction}
                    markdown={pageEntry.Article?.PageArticleData.S || ''}
                    onChange={handleChange}
                    onAddImage={handleAddImage}
                    onAddLink={handleAddLink}
                    onHelp={toggleHelp}
                />
            </div>
        </Card>
    );
}
