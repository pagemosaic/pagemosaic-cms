import React, {useMemo} from 'react';
import debounce from 'lodash-es/debounce';
import set from 'lodash-es/set';
import get from 'lodash-es/get';
import {ContentData} from 'infra-common/data/ContentData';
import {TipTapEditor} from '@/components/utils/TipTapEditor';
import {usePagesBrowser} from '@/features/pages/PagesBrowserProvider';

interface ControlTipTapProps {
    controlKey: number;
    contentData: ContentData;
    fieldPath: string;
    disabled?: boolean;
    onChange: (newContentData: ContentData) => void;
}

export function ControlTipTap(props: ControlTipTapProps) {
    const {controlKey, contentData, fieldPath, disabled, onChange} = props;
    const {showDialog: showPagesBrowser} = usePagesBrowser();

    return useMemo(() => {
        const fieldPathValue = `${fieldPath}.richTextValue`;
        const debouncedOnChange = debounce((path: string, value: string) => {
            if (contentData) {
                const newContentData = set(contentData, path, value);
                onChange(newContentData);
            }
        }, 800);

        const handleOnChange = (html: string) => {
            debouncedOnChange(fieldPathValue, html);
        };

        let defaultRichTextValue = get(
            contentData,
            fieldPathValue,
            undefined
        ) as string | undefined;

        return (
            <div className="w-full">
                <TipTapEditor
                    controlKey={controlKey}
                    content={defaultRichTextValue || ''}
                    onChange={handleOnChange}
                    onLink={(cb) => {
                        showPagesBrowser({
                            title: 'Pages',
                            onSelect: (_, url, pageTitle) => {
                                cb(url, pageTitle);
                            }
                        });
                    }}
                />
            </div>
        );
    }, [controlKey]);
}