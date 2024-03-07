import React from 'react';
import { TreeNode } from "infra-common/system/Bucket";
import {ButtonAction} from '@/components/utils/ButtonAction';
import {LucideUpload} from 'lucide-react';
import {useFetcher, useRevalidator} from 'react-router-dom';
import {useAsyncStatus} from '@/components/utils/AsyncStatusProvider';
import {publicBucketDataSingleton} from '@/data/PublicBucketData';

interface UploadButtonProps {
    node: TreeNode;
}

export function UploadButton(props: UploadButtonProps) {
    const {node} = props;
    let revalidator = useRevalidator();
    const hiddenFileInput = React.useRef<HTMLInputElement>(null);
    const {status, setStatus} = useAsyncStatus();

    const handleUploadChange = (e: any) => {
        const files = e.target.files;
        if (!files.length) {
            return;
        }
        publicBucketDataSingleton.uploadPublicFiles(
            files,
            (complete: number, total: number, cancel) => {
                setStatus({
                    isLoading: true,
                    loadingProgress: complete,
                    loadingTotal: total,
                    cancel
                });
            },
            node.path
        ).then(() => {
            setStatus({isSuccess: true});
            revalidator.revalidate();
        }).catch((e: any) => {
            setStatus({isError: true, error: e.message});
        });
    };

    const handleUploadClick = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };

    return (
        <div>
            <input
                ref={hiddenFileInput}
                style={{display: 'none'}}
                type="file"
                accept="*"
                multiple={true}
                onChange={handleUploadChange}
                onPaste={(e) => {e.stopPropagation();}}
                onClick={(e) => e.stopPropagation()}
            />
            <ButtonAction
                variant="outline"
                size="sm"
                label="Upload Files"
                Icon={LucideUpload}
                isLoading={status.isLoading}
                onClick={handleUploadClick}
            />
        </div>
    );
}