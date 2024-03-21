import set from 'lodash-es/set';
import get from 'lodash-es/get';
import {
    ContentDataConfigClass,
    ContentDataBlockClass,
    ContentDataFieldClass
} from 'infra-common/data/ContentDataConfig';
import {ContentData, ContentDataField, ContentDataBlock} from 'infra-common/data/ContentData';

export function initField(fieldValue: ContentDataField | undefined, fieldClass: ContentDataFieldClass): ContentDataField {
    let result = fieldValue || {};
    if (fieldClass.type === 'composite' && fieldClass.nestedSets && fieldClass.nestedSets.length > 0) {
        result.nestedSetCode = fieldClass.nestedSets[0].nestedCode;
    }
    return result;
}

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
                let newFieldValue: ContentDataField | Array<ContentDataField> = {};
                if (fieldConfig.isArray) {
                    newFieldValue = [];
                    if (fieldValue !== undefined && Array.isArray(fieldValue) && fieldValue.length > 0) {
                        for (let fieldValueIndex = 0; fieldValueIndex < fieldValue.length; fieldValueIndex++) {
                            const fieldValueItem = fieldValue[fieldValueIndex];
                            let newFieldValueItem: ContentDataField = {};
                            if (fieldConfig.type === 'composite' && fieldConfig.nested && fieldConfig.nested.length > 0) {
                                if (fieldConfig.nestedSets && fieldConfig.nestedSets.length > 0) {
                                    newFieldValueItem.nestedSetCode = fieldValueItem.nestedSetCode || fieldConfig.nestedSets[0].nestedCode;
                                }
                                fieldConfig.nested.forEach((nestedFieldConfig) => {
                                    const nestedFieldPath = `nested.${nestedFieldConfig.key}`;
                                    let nestedFieldValueItem = get(fieldValueItem, nestedFieldPath, undefined)  as ContentDataField | undefined;
                                    if (nestedFieldConfig.isArray)  {
                                        if (nestedFieldValueItem !== undefined && Array.isArray(nestedFieldValueItem) && nestedFieldValueItem.length > 0) {
                                            for (let nestedFieldValueIndex = 0; nestedFieldValueIndex < nestedFieldValueItem.length; nestedFieldValueIndex++) {
                                                set(newFieldValueItem, `${nestedFieldPath}.${nestedFieldValueIndex}`, nestedFieldValueItem[nestedFieldValueIndex] || {});
                                            }
                                        }
                                    } else {
                                        set(newFieldValueItem, nestedFieldPath, nestedFieldValueItem || {});
                                    }
                                });
                            } else {
                                newFieldValueItem = fieldValueItem;
                            }
                            newFieldValue[fieldValueIndex] = newFieldValueItem;
                        }
                    }
                } else {
                    if (fieldValue !== undefined) {
                        if (fieldConfig.type === 'composite' && fieldConfig.nested && fieldConfig.nested.length > 0) {
                            if (fieldConfig.nestedSets && fieldConfig.nestedSets.length > 0) {
                                newFieldValue.nestedSetCode = (fieldValue as ContentDataField).nestedSetCode || fieldConfig.nestedSets[0].nestedCode;
                            }
                            fieldConfig.nested.forEach((nestedFieldConfig) => {
                                const nestedFieldPath = `nested.${nestedFieldConfig.key}`;
                                let nestedFieldValue = get(fieldValue, nestedFieldPath, undefined)  as ContentDataField | Array<ContentDataField> | undefined;
                                if (nestedFieldConfig.isArray)  {
                                    if (nestedFieldValue !== undefined && Array.isArray(nestedFieldValue) && nestedFieldValue.length > 0) {
                                        for (let nestedFieldValueIndex = 0; nestedFieldValueIndex < nestedFieldValue.length; nestedFieldValueIndex++) {
                                            set(newFieldValue, `${nestedFieldPath}.${nestedFieldValueIndex}`, nestedFieldValue[nestedFieldValueIndex] || {});
                                        }
                                    }
                                } else {
                                    set(newFieldValue, nestedFieldPath, nestedFieldValue || {});
                                }
                            });
                        } else {
                            newFieldValue = fieldValue;
                        }
                    } else {
                        if (fieldConfig.type === 'composite' && fieldConfig.nested && fieldConfig.nested.length > 0) {
                            if (fieldConfig.nestedSets && fieldConfig.nestedSets.length > 0) {
                                newFieldValue.nestedSetCode = fieldConfig.nestedSets[0].nestedCode;
                            }
                        }
                    }
                }
                set(newBlockData, `fields.${fieldConfig.key}`, newFieldValue);
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
        const value = fields[key] as ContentDataField;
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item.nested) {
                    for (const nestedKey in item.nested) {
                        if (!isFieldEmpty(item.nested[nestedKey])) {
                            return false;
                        }
                    }
                } else if (!isFieldEmpty(item)) {
                    return false;
                }
            }
        } else {
            if (value.nested) {
                for (const nestedKey in value.nested) {
                    const nestedValue = value.nested[nestedKey];
                    if (Array.isArray(nestedValue)) {
                        for (const nestedItem of nestedValue) {
                            if (!isFieldEmpty(nestedItem)) {
                                return false;
                            }
                        }
                    } else if (!isFieldEmpty(nestedValue)) {
                        return false;
                    }
                }
            } else if (!isFieldEmpty(value)) {
                return false;
            }
        }
    }
    return true;
}

function isFieldEmpty(field: ContentDataField): boolean {
    return !field.stringValue && !field.richTextValue && !field.imageSrc && !field.imageAlt && !field.pageId;
}


