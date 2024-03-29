import React from 'react';
import {LucideUpload} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {useAsyncStatus} from '@/components/utils/AsyncStatusProvider';
import {publicBucketDataSingleton} from '@/data/PublicBucketData';
import {TreeNode} from 'infra-common/system/Bucket';

interface AssetsFilesUploadButtonProps {
    node: TreeNode;
    onUpload: () => void;
}

export function AssetsFilesUploadButton(props: AssetsFilesUploadButtonProps) {
    const {node, onUpload} = props;
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
        }).catch((e: any) => {
            setStatus({isError: true, error: e.message});
        }).finally(() => {
            onUpload();
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
                variant="ghost"
                size="sm"
                label="Upload"
                Icon={LucideUpload}
                isLoading={status.isLoading}
                onClick={handleUploadClick}
            />
        </div>
    );
}