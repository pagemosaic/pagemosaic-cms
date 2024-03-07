import React, {useMemo} from 'react';
import {
    LucideHome,
    LucideFolder,
    LucideChevronRight,
    LucideFolderMinus,
    LucideFiles
} from 'lucide-react';
import {PublicBucketStaticData} from '@/data/PublicBucketData';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {findNodeByPath, getParentNodes, nodesComparatorByName} from '@/utils/FileObjectUtils';
import {TreeNode} from 'infra-common/system/Bucket';
import {
    Table,
    TableBody,
    TableCell,
    TableRow
} from '@/components/ui/table';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Card} from '@/components/ui/card';
import {ButtonLink} from '@/components/utils/ButtonLink';
import {humanReadableBytes, getTimeDistance} from '@/utils/FormatUtils';
import {useSessionState} from '@/utils/localStorage';
import {BUCKET_STATIC_DIR} from 'infra-common/constants';
import {useAsyncStatus} from '@/components/utils/AsyncStatusProvider';
import {PublicFilesUploadButton} from './PublicFilesUploadButton';

interface FilesBrowserProps {
    publicBucketData: PublicBucketStaticData;
    onSelect: (url: string) => void;
    onUpload: () => void;
}

export function FilesBrowser(props: FilesBrowserProps) {
    const {publicBucketData, onSelect, onUpload} = props;
    const {status: asyncStatus} = useAsyncStatus();
    const {value: currentPath = `${BUCKET_STATIC_DIR}/`, saveValue} = useSessionState<string>('fileBrowserCurrentPath');

    const currentNode: TreeNode = useMemo(() => {
        let result: TreeNode = {isRoot: true, path: `${BUCKET_STATIC_DIR}/`, name: BUCKET_STATIC_DIR, children: []};
        if (publicBucketData?.publicFilesRoots) {
            let foundCurrentDirNodeInNewTree: TreeNode | undefined = undefined;
            for (const rootTreeNode of publicBucketData?.publicFilesRoots) {
                foundCurrentDirNodeInNewTree = findNodeByPath(rootTreeNode, currentPath);
                if (foundCurrentDirNodeInNewTree) {
                    result = foundCurrentDirNodeInNewTree;
                }
            }
        }
        return result;
    }, [publicBucketData?.publicFilesRoots, currentPath]);

    let folderPath: Array<TreeNode> = currentNode ? getParentNodes(currentNode) : [];
    if (folderPath.length > 3) {
        folderPath = folderPath.slice(-3);
    }

    const handleChangeCurrentPath = (newPath: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        saveValue(newPath);
    };

    const handleSelectItem = (url: string) => (e: React.MouseEvent) => {
        if (!asyncStatus.isLoading) {
            e.stopPropagation();
            e.preventDefault();
            onSelect(url);
        }
    };

    let sortedContent = currentNode.children.sort(nodesComparatorByName('asc'));

    return (
        <div className="w-full h-[450px] flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center flex-nowrap">
                {folderPath.map((folder) => {
                    return (
                        <React.Fragment key={folder.path}>
                            <div>
                                {folder.name === BUCKET_STATIC_DIR
                                    ? (
                                        <ButtonAction
                                            Icon={LucideHome}
                                            variant="ghost"
                                            disabled={asyncStatus.isLoading}
                                            onClick={handleChangeCurrentPath(folder.path)}
                                            size="sm"
                                        />
                                    )
                                    : (
                                        <ButtonAction
                                            Icon={LucideFolder}
                                            label={folder.name}
                                            disabled={asyncStatus.isLoading}
                                            onClick={handleChangeCurrentPath(folder.path)}
                                            variant="ghost"
                                            size="sm"
                                        />
                                    )
                                }
                            </div>
                            <div>
                                <LucideChevronRight className="w-4 h-4"/>
                            </div>
                        </React.Fragment>
                    );
                })}
                <div>
                    {currentNode.name === BUCKET_STATIC_DIR
                        ? (
                            <ButtonAction
                                Icon={LucideHome}
                                variant="ghost"
                                disabled={true}
                                size="sm"
                            />
                        )
                        : (
                            <ButtonAction
                                Icon={LucideFolder}
                                label={currentNode.name}
                                variant="ghost"
                                disabled={true}
                                size="sm"
                            />
                        )
                    }
                </div>
                <div>
                    <ButtonLink
                        to="/files"
                        label="Manage Files"
                        size="sm"
                        variant="outline"
                        Icon={LucideFiles}
                        disabled={asyncStatus.isLoading}
                    />
                </div>
                <div>
                    <PublicFilesUploadButton
                        node={currentNode}
                        onUpload={onUpload}
                    />
                </div>
            </div>
            <div className="relative grow">
                {sortedContent.length > 0
                    ? (
                        <Card className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden">
                            <ScrollArea className="w-full h-full">
                                <Table>
                                    <TableBody>
                                        {sortedContent.map((treeNode, itemIndex) => {
                                            return (
                                                <TableRow key={treeNode.path}>
                                                    {treeNode.fileObject
                                                        ? (
                                                            <>
                                                                <TableCell
                                                                    className="flex flex-row items-center gap-2 flex-nowrap">
                                                                    <div
                                                                        className="w-[150px] h-[150px] rounded-md border-[1px] border-slate-200 overflow-hidden">
                                                                        <img
                                                                            src={treeNode.fileObject.defaultUrl}
                                                                            alt={treeNode.name}
                                                                            className="h-auto w-auto object-cover object-top aspect-square cursor-pointer"
                                                                            onClick={handleSelectItem(treeNode.fileObject.url)}
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="w-full">
                                                                    {(treeNode.fileObject && treeNode.fileObject.size) && (
                                                                        <div className="flex flex-col gap-2">
                                                                            <p className="text-sm">{treeNode.name}</p>
                                                                            <p className="text-sm">{treeNode.fileObject.url}</p>
                                                                            <p className="text-sm">{getTimeDistance(treeNode.fileObject.timestamp)}</p>
                                                                            <p className="text-sm">{humanReadableBytes(treeNode.fileObject.size)}</p>
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                            </>
                                                        )
                                                        : (
                                                            <TableCell colSpan={2}
                                                                       className="flex flex-row items-center gap-2 flex-nowrap">
                                                                <>
                                                                    {treeNode.children.length > 0
                                                                        ? (<LucideFolder className="w-4 h-4"/>)
                                                                        : (<LucideFolderMinus className="w-4 h-4"/>)
                                                                    }
                                                                    <a
                                                                        href="#"
                                                                        onClick={handleChangeCurrentPath(treeNode.path)}
                                                                        className="hover:underline text-blue-600"
                                                                    >
                                                                        {treeNode.name}
                                                                    </a>
                                                                </>
                                                            </TableCell>
                                                        )
                                                    }
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </Card>
                    )
                    : (
                        <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
                            <div>
                                <span className="text-muted-foreground text-sm">There are no images available.</span>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}
