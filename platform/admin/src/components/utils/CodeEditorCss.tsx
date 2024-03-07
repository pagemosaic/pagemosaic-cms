import React from 'react';
import debounce from 'lodash-es/debounce';
import {LucideHelpCircle} from 'lucide-react';
import Editor, {OnChange} from '@monaco-editor/react';
import {useSessionState} from '@/utils/localStorage';
import {ButtonAction} from '@/components/utils/ButtonAction';

interface ContentEditorCssState {
    currentLine: number;
    currentColumn: number;
    scrollTop: number;
}

interface CodeEditorCssProps {
    stateKey: string;
    code: string;
    readOnly?: boolean;
    onChange: (code: string) => void;
    onHelp: () => void;
}

export function CodeEditorCss(props: CodeEditorCssProps) {
    const {stateKey, code, readOnly = false, onChange, onHelp} = props;
    const {
        value: contentEditorCssStateRecords = {},
        saveValue: setContentEditorCssStateRecords
    } = useSessionState<Record<string, ContentEditorCssState>>('contentEditorCssStateRecords');

    // const monaco = useMonaco();

    const handleEditorChange: OnChange = (value, event) => {
        onChange(value || '');
    }

    // useEffect(() => {
    //     if (monaco) {
    //         const provider: IDisposable = monaco.languages.registerCompletionItemProvider('css', {
    //             // triggerCharacters: ['-'],
    //             provideCompletionItems: (model, position): any => {
    //                 const textUntilPosition = model.getValueInRange({
    //                     startLineNumber: position.lineNumber,
    //                     startColumn: 1,
    //                     endLineNumber: position.lineNumber,
    //                     endColumn: position.column
    //                 });
    //                 const lastIndexOfStart = textUntilPosition.lastIndexOf('var(');
    //                 const lastIndexOfEnd = textUntilPosition.lastIndexOf(')');
    //                 const isInside = lastIndexOfStart > 0 && lastIndexOfEnd < lastIndexOfStart;
    //                 if (isInside) {
    //                     const range = {
    //                         startLineNumber: position.lineNumber,
    //                         startColumn: position.column,
    //                         endLineNumber: position.lineNumber,
    //                         endColumn: position.column
    //                     };
    //                     const suggestions: Array<monaco.languages.CompletionItem> = Object.keys(openPropsTokens).map((variable: string) => ({
    //                         insertText: variable,
    //                         insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    //                         label: variable,
    //                         kind: monaco.languages.CompletionItemKind.Variable,
    //                         documentation: variable,
    //                         range
    //                     }));
    //                     return {suggestions, incomplete: false};
    //                 }
    //                 return {suggestions: []};
    //             }
    //         });
    //         return () => {
    //             if (provider) {
    //                 provider.dispose();
    //             }
    //         };
    //     }
    // }, [monaco]);

    return (
        <div className="h-full w-full flex flex-col gap-2">
            <div className="flex flex-row justify-between p-2 gap-2 items-start">
                <div className="flex flex-col gap-1">
                </div>
                <div className="w-full flex flex-row items-center justify-end">
                    <div>
                        <ButtonAction
                            variant="ghost"
                            size="sm"
                            label="Help"
                            disabled={readOnly}
                            Icon={LucideHelpCircle}
                            onClick={onHelp}
                        />
                    </div>
                </div>
            </div>
            <div className="flex-grow relative h-full">

                <Editor
                    height="100%"
                    width="100%"
                    defaultLanguage="scss"
                    defaultValue={code}
                    onMount={(editor) => {
                        editor.updateOptions({lineHeight: 1.7, fontSize: 14});
                        const {
                            currentLine = 0,
                            currentColumn = 0,
                            scrollTop = 0
                        } = contentEditorCssStateRecords[stateKey] || {};
                        setTimeout(() => {
                            editor.setScrollTop(scrollTop);
                            // editor.revealLineInCenter(currentLine);
                            editor.setPosition({lineNumber: currentLine, column: currentColumn});
                            editor.focus();
                            editor.onDidScrollChange(debounce(function (event) {
                                const newState = {...contentEditorCssStateRecords};
                                newState[stateKey] = newState[stateKey] || {};
                                newState[stateKey].scrollTop = event.scrollTop;
                                setContentEditorCssStateRecords(newState);
                            }, 800));
                            editor.onDidChangeCursorPosition(function (event) {
                                const {lineNumber, column} = event.position;
                                const newState = {...contentEditorCssStateRecords};
                                newState[stateKey] = newState[stateKey] || {};
                                newState[stateKey].currentColumn = column;
                                newState[stateKey].currentLine = lineNumber;
                                setContentEditorCssStateRecords(newState);
                            });
                        }, 5);
                    }}
                    options={{
                        fixedOverflowWidgets: true,
                        suggest: {
                            insertMode: 'replace',
                        },
                        readOnly,
                        minimap: {enabled: false}
                    }}
                    onChange={handleEditorChange}
                />
            </div>
        </div>
    );
}