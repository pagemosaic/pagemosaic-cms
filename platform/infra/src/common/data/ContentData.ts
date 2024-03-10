export type ContentDataField = {
    stringValue?: string;
    richTextValue?: string;
    imageSrc?: string;
    imageAlt?: string;
    pageId?: string;
    nested?: Record<string, ContentDataField>;
};

export type ContentDataBlock = {
    key: string;
    fields: Record<string, ContentDataField | Array<ContentDataField>>;
};

export type ContentData = Array<ContentDataBlock>;
