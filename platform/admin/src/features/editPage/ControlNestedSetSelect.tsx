import React, {useMemo} from 'react';
import set from 'lodash-es/set';
import get from 'lodash-es/get';
import {ContentData} from 'infra-common/data/ContentData';
import {ContentDataFieldClass, ContentDataFieldNestedSet} from 'infra-common/data/ContentDataConfig';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from '@/components/ui/select';

interface ControlNestedSetSelectProps {
    controlKey: number;
    contentData: ContentData;
    fieldClass: ContentDataFieldClass;
    fieldPath: string;
    disabled?: boolean;
    onChange: (newContentData: ContentData, doRefresh?: boolean) => void;
}

export function ControlNestedSetSelect(props: ControlNestedSetSelectProps) {
    const {controlKey, contentData, fieldClass, fieldPath, disabled = false, onChange} = props;
    return useMemo(() => {
        const fieldPathValue = `${fieldPath}.nestedSetCode`;

        const nestedSets: Array<ContentDataFieldNestedSet> = fieldClass.nestedSets || [];

        const handleSelectValue = (value: string) => {
            const newContentData = set(contentData, fieldPathValue, value);
            onChange(newContentData, true);
        };

        let defaultNestedSetCode = get(
            contentData,
            fieldPathValue,
            nestedSets[0].nestedCode || ''
        ) as string | undefined;

        return (

            <div className="max-w-full">
                <Select
                    key={controlKey}
                    name={fieldPath}
                    disabled={disabled}
                    onValueChange={handleSelectValue}
                    value={defaultNestedSetCode}
                >
                    <SelectTrigger className="w-auto gap-3">
                        <SelectValue placeholder="Select Fields Set..."/>
                    </SelectTrigger>
                    <SelectContent>
                        {nestedSets.map(({nestedCode, label}) => {
                            return (
                                <SelectItem
                                    key={nestedCode}
                                    value={nestedCode}
                                >
                                    {label}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>
        )
        ;
    }, [controlKey]);
}
