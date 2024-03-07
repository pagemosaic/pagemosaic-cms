import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {useSessionState} from '@/utils/localStorage';
import {CodeEditorHtmlSuggestionsRecords} from '@/components/utils/CodeEditorHtml';

export function useSuggestions() {
    const {value: suggestionsRecords} = useSessionState<CodeEditorHtmlSuggestionsRecords>('codeEditorHtmlSuggestions');
    let objectSuggestions: Array<monaco.languages.CompletionItem> = [];
    let classesSuggestions: Array<monaco.languages.CompletionItem> = [];
    let markdownSuggestions: Array<monaco.languages.CompletionItem> = [];
    if (suggestionsRecords) {
        const {suggestionsForClasses = [], suggestionsForObjects = []} = suggestionsRecords;
        if (suggestionsForClasses.length > 0) {
            classesSuggestions = suggestionsForObjects.map(key => ({
                label: key,
                kind: monaco.languages.CompletionItemKind.Property,
                insertText: key,
                range: {} as any
            }));
        }
    }
    return {
        objectSuggestions,
        classesSuggestions,
        markdownSuggestions
    };
}