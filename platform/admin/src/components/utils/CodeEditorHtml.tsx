import React, {useEffect} from 'react';
import Editor, {OnChange, useMonaco} from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {useSessionState} from '@/utils/localStorage';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {LucideHelpCircle} from 'lucide-react';
import debounce from 'lodash-es/debounce';

export type CodeEditorHtmlSuggestionsRecords = {
    suggestionsForClasses?: Array<string>;
    suggestionsForObjects?: Array<string>;
}

interface ContentEditorHtmlState {
    currentLine: number;
    currentColumn: number;
    scrollTop: number;
}

interface CodeEditorHtmlProps {
    stateKey: string;
    code: string;
    readOnly?: boolean;
    withSuggestions?: boolean;
    onChange: (code: string) => void;
    onHelp: () => void;
}

export function CodeEditorHtml(props: CodeEditorHtmlProps) {
    const {stateKey, code, readOnly = false, withSuggestions = true, onChange, onHelp} = props;
    const monaco = useMonaco();
    const {value: suggestionsRecords} = useSessionState<CodeEditorHtmlSuggestionsRecords>('codeEditorHtmlSuggestions');
    const {
        value: contentEditorHtmlStateRecords = {},
        saveValue: setContentEditorHtmlStateRecords
    } = useSessionState<Record<string, ContentEditorHtmlState>>('contentEditorHtmlStateRecords');

    const handleEditorChange: OnChange = (value, event) => {
        onChange(value || '');
    }

    useEffect(() => {
        if (monaco && suggestionsRecords && withSuggestions) {
            const {suggestionsForClasses = [], suggestionsForObjects = []} = suggestionsRecords;
            const providers: Array<monaco.IDisposable> = [];
            providers.push(
                monaco.languages.registerCompletionItemProvider('html', {
                    provideCompletionItems: (model, position) => {
                        const fullLineText = model.getLineContent(position.lineNumber);
                        const textUntilPosition = fullLineText.substring(0, position.column - 1);
                        const textAfterPosition = fullLineText.substring(position.column - 1);

                        const range = {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        };

                        // Adjust the logic to check for an unclosed opening "{{" before and no closing "}}" after the cursor until the end of the line
                        const lastIndexOfStartHandlebars = textUntilPosition.lastIndexOf('{');
                        const indexOfEndHandlebarsAfterCursor = textAfterPosition.indexOf('}');
                        const insideHandlebars = lastIndexOfStartHandlebars >= 0 && indexOfEndHandlebarsAfterCursor >= 0;

                        // Class attribute detection logic adjustment
                        const lastIndexOfStartClass = textUntilPosition.lastIndexOf('class="') + 'class="'.length;
                        const indexOfEndClassAfterCursor = textAfterPosition.indexOf('"') + 1; // Adjusted to ensure cursor is within quotes
                        const insideClass = lastIndexOfStartClass > 'class="'.length && indexOfEndClassAfterCursor > 0; // Checks if cursor is within class quotes

                        if (insideHandlebars) {
                            const suggestions: Array<monaco.languages.CompletionItem> = suggestionsForObjects.map(key => ({
                                label: key,
                                kind: monaco.languages.CompletionItemKind.Property,
                                insertText: key,
                                range: range
                            }));
                            return {suggestions, incomplete: false};
                        } else if (insideClass) {
                            const suggestions: Array<monaco.languages.CompletionItem> = suggestionsForClasses.map(key => ({
                                label: key,
                                kind: monaco.languages.CompletionItemKind.Keyword,
                                insertText: key,
                                range: range
                            }));
                            return {suggestions, incomplete: false};
                        } else {
                            return {suggestions: []};
                        }
                    }
                })
            );

            return () => {
                for (const provider of providers) {
                    provider.dispose();
                }
            };
        }
    }, [monaco, suggestionsRecords, withSuggestions]);

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
                    defaultLanguage="html"
                    defaultValue={code}
                    onMount={(editor) => {
                        editor.updateOptions({lineHeight: 1.7, fontSize: 14 });
                        const {
                            currentLine = 0,
                            currentColumn = 0,
                            scrollTop = 0
                        } = contentEditorHtmlStateRecords[stateKey] || {};
                        setTimeout(() => {
                            editor.setScrollTop(scrollTop);
                            // editor.revealLineInCenter(currentLine);
                            editor.setPosition({lineNumber: currentLine, column: currentColumn});
                            editor.focus();
                            editor.onDidScrollChange(debounce(function (event) {
                                const newState = {...contentEditorHtmlStateRecords};
                                newState[stateKey] = newState[stateKey] || {};
                                newState[stateKey].scrollTop = event.scrollTop;
                                setContentEditorHtmlStateRecords(newState);
                            }, 800));
                            editor.onDidChangeCursorPosition(function (event) {
                                const {lineNumber, column} = event.position;
                                const newState = {...contentEditorHtmlStateRecords};
                                newState[stateKey] = newState[stateKey] || {};
                                newState[stateKey].currentColumn = column;
                                newState[stateKey].currentLine = lineNumber;
                                setContentEditorHtmlStateRecords(newState);
                            });
                        }, 5);
                    }}
                    options={{
                        fixedOverflowWidgets: true,
                        suggest: {
                            insertMode: 'replace',
                        },
                        readOnly,
                        quickSuggestions: false,
                        // suggestOnTriggerCharacters: false,
                        minimap: {enabled: false}
                    }}
                    onChange={handleEditorChange}
                />
            </div>
        </div>
    );
}
