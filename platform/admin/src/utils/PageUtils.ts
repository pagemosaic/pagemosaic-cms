import set from 'lodash-es/set';
import get from 'lodash-es/get';
import {ContentDataConfigClass, ContentDataBlockClass} from 'infra-common/data/ContentDataConfig';
import {ContentData, ContentDataField, ContentDataBlock} from 'infra-common/data/ContentData';

export function buildOrUpdateContentObject(config: ContentDataConfigClass, existingObject: ContentData = []): ContentData {
    const result: ContentData = [];
    let contentDataBlockClass: ContentDataBlockClass | undefined;
    let index = 0;
    for (const contentDataBlock of existingObject) {
        contentDataBlockClass = config[contentDataBlock.key];
        if (contentDataBlockClass) {
            let newBlockData: ContentDataBlock = {
                key: contentDataBlock.key,
                fields: {}
            };
            contentDataBlockClass.fields.forEach(fieldConfig => {
                const fieldPath = `${index}.fields.${fieldConfig.key}`;
                let fieldValue = get(existingObject, fieldPath, undefined) as ContentDataField | Array<ContentDataField> | undefined;

                if (fieldValue === undefined || fieldConfig.isArray !== Array.isArray(fieldValue)) {
                    fieldValue = fieldConfig.isArray ? [] : {};
                }

                set(newBlockData, `fields.${fieldConfig.key}`, fieldValue);
            });
            result.push(newBlockData);
        }
        index++;
    }
    return result;
}

export function isContentDataBlockEmpty(contentDataBlock: ContentDataBlock): boolean {
    const fields = contentDataBlock.fields;
    for (const key in fields) {
        const value = fields[key];
        if (Array.isArray(value)) {
            for (const item of value) {
                if (!isFieldEmpty(item)) {
                    return false;
                }
            }
        } else {
            if (!isFieldEmpty(value)) {
                return false;
            }
        }
    }
    return true;
}

function isFieldEmpty(field: ContentDataField): boolean {
    return !field.stringValue && !field.richTextValue && !field.imageSrc && !field.imageAlt && !field.pageId;
}


