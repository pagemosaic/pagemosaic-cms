import React, {useMemo} from 'react';
import set from 'lodash-es/set';
import get from 'lodash-es/get';
import {ContentData} from 'infra-common/data/ContentData';
import {ContentDataFieldClass} from 'infra-common/data/ContentDataConfig';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from '@/components/ui/select';

interface ControlStringWithVariantsProps {
    controlKey: number;
    contentData: ContentData;
    fieldClass: ContentDataFieldClass;
    fieldPath: string;
    disabled?: boolean;
    onChange: (newContentData: ContentData, doRefresh?: boolean) => void;
}

export function ControlStringWithVariants(props: ControlStringWithVariantsProps) {
    const {controlKey, contentData, fieldClass, fieldPath, disabled = false, onChange} = props;
    return useMemo(() => {
        const fieldPathValue = `${fieldPath}.stringValue`;

        const handleSelectValue = (value: string) => {
            const newContentData = set(contentData, fieldPathValue, value);
            onChange(newContentData, true);
        };

        let defaultStringValue = get(
            contentData,
            fieldPathValue,
            undefined
        ) as string | undefined;

        return (

            <div className="max-w-full">
                <Select
                    key={controlKey}
                    name={fieldPath}
                    disabled={disabled}
                    onValueChange={handleSelectValue}
                    value={defaultStringValue}
                >
                    <SelectTrigger className="w-auto gap-3">
                        <SelectValue placeholder="Select Value..."/>
                    </SelectTrigger>
                    <SelectContent>
                        {fieldClass.variants?.map(({value, label}) => {
                            return (
                                <SelectItem
                                    key={value}
                                    value={value}
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
