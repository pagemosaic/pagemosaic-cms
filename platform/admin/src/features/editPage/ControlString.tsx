import React, {useMemo} from 'react';
import debounce from 'lodash-es/debounce';
import set from 'lodash-es/set';
import get from 'lodash-es/get';
import {ContentData} from 'infra-common/data/ContentData';
import {Input} from '@/components/ui/input';

interface ControlStringProps {
    controlKey: number;
    contentData: ContentData;
    fieldPath: string;
    disabled?: boolean;
    onChange: (newContentData: ContentData) => void;
}

export function ControlString(props: ControlStringProps) {
    const {controlKey, contentData, fieldPath, disabled = false, onChange} = props;
    return useMemo(() => {
        const fieldPathValue = `${fieldPath}.stringValue`;
        const debouncedOnContentDataTextChange = debounce((path: string, value: string) => {
            if (contentData) {
                const newContentData = set(contentData, path, value);
                onChange(newContentData);
            }
        }, 800);

        const handleContentDataTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            debouncedOnContentDataTextChange(fieldPathValue, e.currentTarget.value);
        };

        let defaultStringValue = get(
            contentData,
            fieldPathValue,
            undefined
        ) as string | undefined;

        return (
            <Input
                key={controlKey}
                name={fieldPath}
                type="text"
                disabled={disabled}
                defaultValue={defaultStringValue}
                onChange={handleContentDataTextChange}
            />
        );
    }, [controlKey]);
}
