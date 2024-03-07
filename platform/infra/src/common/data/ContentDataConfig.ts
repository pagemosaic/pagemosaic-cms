export const ContentDataFieldTypes = [
    'image',
    'string',
    'rich_text',
    'page_link'
] as const;

export type ContentDataFieldVariant = {
    label: string;
    value: string;
};

export type ContentDataFieldClass = {
    label: string;
    key: string;
    type: typeof ContentDataFieldTypes[number];
    isArray?: boolean;
    variants?: Array<ContentDataFieldVariant>;
    help?: string;
};

export type ContentDataBlockClass = {
    group?: string;
    label: string;
    fields: Array<ContentDataFieldClass>;
};

export type ContentDataConfigClass = Record<string, ContentDataBlockClass>;
