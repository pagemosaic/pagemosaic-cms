export const ContentDataFieldTypes = [
    'image',
    'string',
    'rich_text',
    'page_link',
    'composite'
] as const;

export type ContentDataFieldVariant = {
    label: string;
    value: string;
};

export type ContentDataFieldBaseClass = {
    label: string;
    key: string;
    type: typeof ContentDataFieldTypes[number];
    variants?: Array<ContentDataFieldVariant>;
    help?: string;
};

export type ContentDataFieldClass = ContentDataFieldBaseClass & {
    isArray?: boolean;
    nested?: Array<ContentDataFieldBaseClass>;
};

export type ContentDataBlockClass = {
    group?: string;
    label: string;
    fields: Array<ContentDataFieldClass>;
};

export type ContentDataConfigClass = Record<string, ContentDataBlockClass>;
