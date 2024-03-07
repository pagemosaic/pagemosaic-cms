import Editor, {OnChange} from '@monaco-editor/react';

export type SuggestionItem = {
    label: string;
    text: string;
    documentation: string;
    suggestionType: 'var' | 'snippet' | 'text' | 'class' | 'keyword';
};

export type SuggestionConditionFunction = (text?: string) => boolean;

interface CodeEditorProps {
    language: 'handlebars' | 'css' | 'json' | 'html';
    code: string;
    readOnly?: boolean;
    onChange: (code: string) => void;
}

export function CodeEditor(props: CodeEditorProps) {
    const {language, code, readOnly = false, onChange} = props;

    const handleEditorChange: OnChange = (value, event) => {
        onChange(value || '');
    }

    return (
        <Editor
            height="100%"
            width="100%"
            defaultLanguage={language}
            defaultValue={code}
            options={{
                readOnly,
                minimap: {enabled: false}
            }}
            onChange={handleEditorChange}
        />
    );
}