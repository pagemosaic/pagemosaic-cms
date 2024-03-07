import React, {useEffect, RefAttributes, forwardRef, useImperativeHandle, useRef} from 'react';
import {LucideImagePlus, LucideLink, LucideHelpCircle} from 'lucide-react';
import Editor, {OnChange, useMonaco} from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {useSessionState} from '@/utils/localStorage';
import {CodeEditorHtmlSuggestionsRecords} from '@/components/utils/CodeEditorHtml';
import {editor} from 'monaco-editor/esm/vs/editor/editor.api';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import debounce from 'lodash-es/debounce';

interface ContentEditorMarkdownState {
    currentLine: number;
    currentColumn: number;
    scrollTop: number;
}

export type CodeEditorMarkdownHandle = {
    insertTextAtCursor: (value: string, toSelect: string) => void;
    setFocus: () => void;
};

type CodeEditorMarkdownProps = RefAttributes<CodeEditorMarkdownHandle> & {
    stateKey: string;
    markdown: string;
    readOnly?: boolean;
    onChange: (code: string) => void;
    onAddImage?: () => void;
    onAddLink?: () => void;
    onHelp?: () => void;
};

export const CodeEditorMarkdown = forwardRef<CodeEditorMarkdownHandle, CodeEditorMarkdownProps>((props, ref) => {
    const {stateKey, markdown, readOnly = false, onChange, onAddImage, onAddLink, onHelp} = props;
    const monaco = useMonaco();
    const editorRef = useRef<IStandaloneCodeEditor>();
    const {value: suggestionsRecords} = useSessionState<CodeEditorHtmlSuggestionsRecords>('codeEditorHtmlSuggestions');
    const {
        value: contentEditorMarkdownStateRecords = {},
        saveValue: setContentEditorMarkdownStateRecords
    } = useSessionState<Record<string, ContentEditorMarkdownState>>('contentEditorMarkdownStateRecords');

    useImperativeHandle(ref, () => ({
        insertTextAtCursor: (value: string, toSelect: string) => {
            if (editorRef.current && monaco) {
                const selection = editorRef.current.getSelection();
                if (selection) {
                    const range = new monaco.Range(
                        selection.startLineNumber,
                        selection.startColumn,
                        selection.endLineNumber,
                        selection.endColumn
                    );
                    editorRef.current.executeEdits("", [
                        {range: range, text: value, forceMoveMarkers: true}
                    ]);

                    // Calculate the positions for the selection of toSelect text
                    const toSelectIndex = value.indexOf(toSelect);
                    if (toSelectIndex !== -1) {
                        const startColumn = selection.startColumn + toSelectIndex;
                        const endColumn = startColumn + toSelect.length;

                        // Set the new selection range to only include the toSelect portion
                        const newSelection = new monaco.Selection(
                            selection.startLineNumber,
                            startColumn,
                            selection.startLineNumber,
                            endColumn
                        );
                        editorRef.current.setSelection(newSelection);
                        editorRef.current.revealPosition({
                            lineNumber: selection.startLineNumber,
                            column: endColumn
                        });
                    }
                }
            }
        },
        setFocus: () => {
            if (editorRef.current) {
                editorRef.current.focus();
            }
        }
    }));

    const handleEditorChange: OnChange = (value, event) => {
        onChange(value || '');
    }

    useEffect(() => {
        if (monaco && suggestionsRecords) {
            const {suggestionsForClasses = [], suggestionsForObjects = []} = suggestionsRecords;
            const providers: Array<monaco.IDisposable> = [];
            providers.push(
                monaco.languages.registerCompletionItemProvider('markdown', {
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
                        const lastIndexOfStartHandlebars = textUntilPosition.lastIndexOf('{{');
                        const indexOfEndHandlebarsAfterCursor = textAfterPosition.indexOf('}}');
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
                            const suggestions: Array<monaco.languages.CompletionItem> = [
                                {
                                    label: 'Header 1',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '# ${1:Header 1}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert Header 1',
                                    range,
                                },
                                {
                                    label: 'Header 2',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '## ${1:Header 2}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert Header 2',
                                    range,
                                },
                                {
                                    label: 'Bold Text',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '**${1:bold text}**',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Make text bold',
                                    range,
                                },
                                // Italic Text
                                {
                                    label: 'Italic Text',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '*${1:italic text}*',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Make text italic',
                                    range,
                                },
                                // Link
                                {
                                    label: 'Link',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '[${1:link text}](${2:url})',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert a hyperlink',
                                    range,
                                },
                                // Image
                                {
                                    label: 'Image',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '![${1:alt text}](${2:url})',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert an image',
                                    range,
                                },
                                // Unordered List
                                {
                                    label: 'Unordered List',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '- ${1:list item}\n- ${2:list item}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert an unordered list',
                                    range,
                                },
                                // Ordered List
                                {
                                    label: 'Ordered List',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '1. ${1:list item}\n2. ${2:list item}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert an ordered list',
                                    range,
                                },
                                // Blockquote
                                {
                                    label: 'Blockquote',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '> ${1:blockquote}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert a blockquote',
                                    range,
                                },
                                // Inline Code
                                {
                                    label: 'Inline Code',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '`${1:code}`',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert inline code',
                                    range,
                                },
                                // Code Block
                                {
                                    label: 'Code Block',
                                    kind: monaco.languages.CompletionItemKind.Snippet,
                                    insertText: '```\n${1:code}\n```',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Insert a code block',
                                    range,
                                },
                            ];
                            return {suggestions, incomplete: false};
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
    }, [monaco, suggestionsRecords]);

    return (
        <div className="h-full w-full flex flex-col gap-2">
            <div className="flex flex-row justify-between p-2 gap-2 items-start">
                <div className="flex flex-col gap-1">
                </div>
                <div className="w-full flex flex-row items-center justify-end">
                    {onHelp && (
                        <div>
                            <ButtonAction
                                variant="ghost"
                                size="sm"
                                label="Help"
                                Icon={LucideHelpCircle}
                                onClick={onHelp}
                            />
                        </div>
                    )}
                    <div>
                        <ButtonAction
                            variant="ghost"
                            size="sm"
                            label="Add Image"
                            disabled={readOnly}
                            Icon={LucideImagePlus}
                            onClick={() => {
                                if (onAddImage) onAddImage();
                            }}
                        />
                    </div>
                    <div>
                        <ButtonAction
                            variant="ghost"
                            size="sm"
                            label="Add Link"
                            disabled={readOnly}
                            Icon={LucideLink}
                            onClick={() => {
                                if (onAddLink) onAddLink();
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="flex-grow relative h-full">
                <Editor
                    height="100%"
                    width="100%"
                    defaultLanguage="markdown"
                    defaultValue={markdown}
                    onMount={(editor) => {
                        editor.updateOptions({lineHeight: 1.7, fontSize: 14 });
                        editorRef.current = editor;
                        const {
                            currentLine = 0,
                            currentColumn = 0,
                            scrollTop = 0
                        } = contentEditorMarkdownStateRecords[stateKey] || {};
                        setTimeout(() => {
                            editor.setScrollTop(scrollTop);
                            // editor.revealLineInCenter(currentLine);
                            editor.setPosition({lineNumber: currentLine, column: currentColumn});
                            editor.focus();
                            editor.onDidScrollChange(debounce(function (event) {
                                const newState = {...contentEditorMarkdownStateRecords};
                                newState[stateKey] = newState[stateKey] || {};
                                newState[stateKey].scrollTop = event.scrollTop;
                                setContentEditorMarkdownStateRecords(newState);
                            }, 800));
                            editor.onDidChangeCursorPosition(function (event) {
                                const {lineNumber, column} = event.position;
                                const newState = {...contentEditorMarkdownStateRecords};
                                newState[stateKey] = newState[stateKey] || {};
                                newState[stateKey].currentColumn = column;
                                newState[stateKey].currentLine = lineNumber;
                                setContentEditorMarkdownStateRecords(newState);
                            });
                        }, 5);
                    }}
                    options={{
                        fixedOverflowWidgets: true,
                        quickSuggestions: false,
                        readOnly,
                        minimap: {enabled: false}
                    }}
                    onChange={handleEditorChange}
                />
            </div>
        </div>
    );
});
