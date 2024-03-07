import React, {useEffect, useState} from 'react';
import * as z from 'zod';
import Editor, {OnChange, useMonaco} from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {languages} from 'monaco-editor/esm/vs/editor/editor.api';
import {ContentDataFieldTypes} from 'infra-common/data/ContentDataConfig';
import CompletionItemInsertTextRule = languages.CompletionItemInsertTextRule;
import {ButtonAction} from '@/components/utils/ButtonAction';
import {LucideX, LucideCheck, LucideHelpCircle} from 'lucide-react';
import {useSessionState} from '@/utils/localStorage';
import debounce from 'lodash-es/debounce';

interface ContentEditorJsonState {
    currentLine: number;
    currentColumn: number;
    scrollTop: number;
}

interface CodeEditorJsonProps {
    stateKey: string;
    code: string;
    readOnly?: boolean;
    onHelp: () => void;
    onSubmit: (code: string) => void;
    onCancel: () => void;
}

// Define the ContentDataFieldTypes
const ZContentDataFieldTypes = z.enum(ContentDataFieldTypes, {
    errorMap: (issue, ctx) => ({message: 'Please select a correct field type'})
});

// Define the ContentDataFieldClass schema
const ZContentDataFieldClass = z.object({
    label: z.string().min(2, {
        message: 'The field label must be at least 2 characters',
    }),
    key: z.string()
        .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, {
            message: 'The field key must start with a letter and contain only alphanumeric characters (letters and numbers)'
        })
        .min(2, {
            message: 'The field key must be at least 2 characters',
        }),
    type: ZContentDataFieldTypes,
    isArray: z.boolean().optional(),
}, {
    errorMap: () => ({message: 'The configuration is not valid. Double check the properties names.'})
});

// Define the ContentDataBlockClass schema
const ZContentDataBlockClass = z.object({
    label: z.string().min(2, {
        message: 'The block label must be at least 2 characters',
    }),
    code: z.string()
        .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, {
            message: 'The block code must start with a letter and contain only alphanumeric characters (letters and numbers)'
        })
        .min(2, {
            message: 'The block code must be at least 2 characters',
        }),
    fields: z.array(ZContentDataFieldClass),
}, {
    errorMap: () => ({message: 'The configuration is not valid. Double check the properties names.'})
});

// Define the ContentDataConfigClass schema
const ZContentDataConfigClass = z.array(ZContentDataBlockClass, {
    errorMap: () => ({message: 'The configuration is not valid. Double check the properties names.'})
});

const contentDataFieldClassSnippet = `{
    "label": "\${1:Field Label}",
    "key": "\${2:fieldKey}",
    "type": "\${3:string}",
    "isArray": \${4:false}
}`;

const contentDataFieldWithVariantsClassSnippet = `{
    "label": "\${1:Field Label}",
    "key": "\${2:fieldKey}",
    "type": "\${3:string}",
    "isArray": \${4:false},
    "variants": [
        {
            "label": "Variant 1 Label",
            "value": "variant1"
        },
        {
            "label": "Variant 2 Label",
            "value": "variant2"
        }
    ]
}`;

const contentDataBlockClassSnippet = `{
    "label": "\${1:Block Label}",
    "fields": [
        {
            "label": "\${2:Field Label}",
            "key": "\${3:fieldKey}",
            "type": "\${4:string}",
            "isArray": \${5:false}
        }
    ]
}`;

const contentDataConfigClassSnippet = `[
    {
        "\${1:blockKey}": {
            "label": "\${2:Block Label}",
            "fields": [
                {
                    "label": "\${3:Field Label}",
                    "key": "\${4:fieldKey}",
                    "type": "\${5:string}",
                    "isArray": \${6:false}
                }
            ]
        }
    }
]`;

export function CodeEditorJson(props: CodeEditorJsonProps) {
    const {stateKey, code, readOnly = false, onSubmit, onCancel, onHelp} = props;
    const monaco = useMonaco();
    const {value: contentEditorJsonStateRecords = {}, saveValue: setContentEditorJsonStateRecords} = useSessionState<Record<string, ContentEditorJsonState>>('contentEditorJsonStateRecords');
    const [configErrors, setConfigErrors] = useState<Array<string>>([]);
    const [config, setConfig] = useState<string>();

    const handleEditorChange: OnChange = (value, event) => {
        setConfig(value || '');
    }

    const handleSubmitConfig = () => {
        if (config && config.length > 0) {
            try {
                // const newContentDataConfigClass = JSON.parse(config);
                // const dataConfigValidationResult = ZContentDataConfigClass.safeParse(newContentDataConfigClass);
                // if (!dataConfigValidationResult.success) {
                //     let newFieldErrors: Array<string> = [];
                //     for (const zodError of dataConfigValidationResult.error.errors) {
                //         newFieldErrors.push(`${zodError.code} | ${zodError.path.join('.')} | ${zodError.message}`);
                //     }
                //     setConfigErrors(newFieldErrors);
                // } else {
                //     setConfigErrors([]);
                //     onSubmit(config);
                // }
                setConfigErrors([]);
                onSubmit(config);
            } catch (e: any) {
                setConfigErrors([`Error parsing the configuration. ${e.message}`]);
            }
        } else {
            setConfigErrors(['The configuration should be not empty.']);
        }
    };

    useEffect(() => {
        if (monaco) {
            const providers: Array<monaco.IDisposable> = [];
            providers.push(
                monaco.languages.registerCompletionItemProvider('json', {
                    provideCompletionItems: (model, position): any => {
                        // const lineCount = model.getLineCount();
                        const firstLineContent = model.getLineContent(1);
                        const range = {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        };
                        if (firstLineContent.trim().length === 0) {
                            return {
                                suggestions: [
                                    {
                                        label: 'Insert a configuration structure',
                                        insertText: contentDataConfigClassSnippet,
                                        kind: monaco.languages.CompletionItemKind.Snippet,
                                        range,
                                        insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                                    } as monaco.languages.CompletionItem,
                                ],
                                incomplete: false
                            }
                        } else if (firstLineContent.endsWith('{')) {
                            if (model.getLineContent(position.lineNumber).trim().length === 0) {
                                return {
                                    suggestions: [
                                        {
                                            label: 'Insert a field',
                                            insertText: contentDataFieldClassSnippet,
                                            kind: monaco.languages.CompletionItemKind.Snippet,
                                            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                                            range
                                        },
                                        {
                                            label: 'Insert a field with variants',
                                            insertText: contentDataFieldWithVariantsClassSnippet,
                                            kind: monaco.languages.CompletionItemKind.Snippet,
                                            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                                            range
                                        },
                                        {
                                            label: 'Insert a block',
                                            insertText: contentDataBlockClassSnippet,
                                            kind: monaco.languages.CompletionItemKind.Snippet,
                                            insertTextRules: CompletionItemInsertTextRule.InsertAsSnippet,
                                            range
                                        }
                                    ],
                                    incomplete: false
                                };
                            }
                        }
                        return {suggestions: []};
                    }
                })
            );

            providers.push(
                monaco.languages.registerCompletionItemProvider('json', {
                    // triggerCharacters: ['"'],
                    provideCompletionItems: (model, position): any => {
                        const textUntilPosition = model.getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn: 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        });
                        if (textUntilPosition.trim().startsWith('"type":') && textUntilPosition.endsWith('"')) {
                            const range = {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            };
                            const suggestions: Array<monaco.languages.CompletionItem> = ContentDataFieldTypes.map((variable: string) => ({
                                insertText: variable,
                                label: variable,
                                kind: monaco.languages.CompletionItemKind.Value,
                                documentation: variable,
                                range
                            }));
                            return {suggestions, incomplete: false};
                        }
                        return {suggestions: []};
                    }
                })
            );
            return () => {
                for (const provider of providers) {
                    provider.dispose();
                }
            };
        }
    }, [monaco]);

    return (
        <div className="h-full w-full flex flex-col gap-2">
            <div className="flex flex-row justify-between p-2 gap-2 items-start">
                <div className="flex flex-col gap-1">
                    {configErrors.map((configError, idx) => (
                        <div key={`error${idx}`}>
                            <p className="text-xs text-red-600">{configError}</p>
                        </div>
                    ))}
                </div>
                <div className="w-full flex flex-row items-center justify-end">
                    <div>
                        <ButtonAction
                            variant="ghost"
                            size="sm"
                            label="Cancel"
                            Icon={LucideX}
                            onClick={onCancel}
                        />
                    </div>
                    <div>
                        <ButtonAction
                            variant="ghost"
                            size="sm"
                            label="Help"
                            Icon={LucideHelpCircle}
                            onClick={onHelp}
                        />
                    </div>
                    <div>
                        <ButtonAction
                            variant="ghost"
                            size="sm"
                            label="Save"
                            Icon={LucideCheck}
                            disabled={!config}
                            onClick={handleSubmitConfig}
                        />
                    </div>
                </div>
            </div>
            <div className="flex-grow relative h-full">
                <Editor
                    height="100%"
                    width="100%"
                    defaultLanguage="json"
                    defaultValue={code}
                    onMount={(editor) => {
                        editor.updateOptions({lineHeight: 1.7, fontSize: 14 });
                        const {currentLine = 0, currentColumn = 0, scrollTop = 0} = contentEditorJsonStateRecords[stateKey] || {};
                        setTimeout(() => {
                            editor.setScrollTop(scrollTop);
                            // editor.revealLineInCenter(currentLine);
                            editor.setPosition({ lineNumber: currentLine, column: currentColumn });
                            editor.focus();
                            editor.onDidScrollChange(debounce(function(event) {
                                const newState = {...contentEditorJsonStateRecords};
                                newState[stateKey] = newState[stateKey] || {};
                                newState[stateKey].scrollTop = event.scrollTop;
                                setContentEditorJsonStateRecords(newState);
                            }, 800));
                            editor.onDidChangeCursorPosition(function(event) {
                                const {lineNumber, column} = event.position;
                                const newState = {...contentEditorJsonStateRecords};
                                newState[stateKey] = newState[stateKey] || {};
                                newState[stateKey].currentColumn = column;
                                newState[stateKey].currentLine = lineNumber;
                                setContentEditorJsonStateRecords(newState);
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
