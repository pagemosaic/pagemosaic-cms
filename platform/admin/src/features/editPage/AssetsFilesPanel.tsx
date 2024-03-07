import React, {useState, useRef, useEffect, useMemo} from 'react';
import {LucideSortAsc, LucideHome, LucideFolder, LucideChevronRight, LucideFolderMinus} from 'lucide-react';
import {Card} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Table, TableRow, TableCell, TableBody, TableHead, TableHeader} from '@/components/ui/table';
import {useAsyncStatus} from '@/components/utils/AsyncStatusProvider';
import {PublicBucketAssetsData, publicBucketDataSingleton} from '@/data/PublicBucketData';
import {nodesComparatorByName, findNodeByPath, getParentNodes} from '@/utils/FileObjectUtils';
import {Checkbox} from '@/components/ui/checkbox';
import {humanReadableBytes} from '@/utils/FormatUtils';
import {AssetsFilesUploadButton} from '@/features/editPage/AssetsFilesUploadButton';
import {TreeNode} from 'infra-common/system/Bucket';
import {BUCKET_ASSETS_DIR} from 'infra-common/constants';
import {AssetsFilesDeleteButton} from '@/features/editPage/AssetsFilesDeleteButton';
import {CopyToClipboardButton} from '@/components/utils/CopyToClipboardButton';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';
import {useSessionState} from '@/utils/localStorage';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {FileIcon} from '@/components/utils/FileIcon';
import {AssetsFilesAddFolderButton} from '@/features/editPage/AssetsFilesAddFolderButton';

export function AssetsFilesPanel() {
    const {status, setStatus} = useAsyncStatus();
    const publicBucketDataRef = useRef<PublicBucketAssetsData>(null);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const {
        value: currentPath = `${BUCKET_ASSETS_DIR}/`,
        saveValue: setCurrentPath
    } = useSessionState<string>('assetsFilesCurrentPath');

    const currentNode: TreeNode = useMemo(() => {
        let result: TreeNode = {isRoot: true, path: `${BUCKET_ASSETS_DIR}/`, name: BUCKET_ASSETS_DIR, children: []};
        if (publicBucketDataRef.current?.publicFilesRoots) {
            let foundCurrentDirNodeInNewTree: TreeNode | undefined = undefined;
            for (const rootTreeNode of publicBucketDataRef.current?.publicFilesRoots) {
                foundCurrentDirNodeInNewTree = findNodeByPath(rootTreeNode, currentPath);
                if (foundCurrentDirNodeInNewTree) {
                    result = foundCurrentDirNodeInNewTree;
                }
            }
        }
        return result;
    }, [publicBucketDataRef.current?.publicFilesRoots, currentPath]);

    const reloadData = () => {
        setStatus({isLoading: true});
        publicBucketDataSingleton.getPublicAssetsFiles()
            .then((publicBucketData: PublicBucketAssetsData) => {
                publicBucketDataRef.current = publicBucketData;
                setStatus({isSuccess: true});
            })
            .catch((e: any) => {
                setStatus({isError: true, error: e.message});
            });
    };

    useEffect(() => {
        reloadData();
    }, []);

    const handleChangeCurrentPath = (newPath: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentPath(newPath);
    };

    const handleSelectItem = (itemPath: string) => (checked: boolean) => {
        setSelected(prevSelected => {
            let newSelected = {...prevSelected};
            if (checked) {
                newSelected[itemPath] = true;
            } else {
                delete newSelected[itemPath];
            }
            return newSelected;
        });
    };

    let folderPath: Array<TreeNode> = currentNode ? getParentNodes(currentNode) : [];
    if (folderPath.length > 3) {
        folderPath = folderPath.slice(-3);
    }

    let sortedContent = currentNode.children.sort(nodesComparatorByName('asc'));

    return (
        <Card className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden pb-6">
            <div className="h-full w-full flex flex-col gap-2">
                {status.isError && (
                    <div>
                        <p className="text-xs text-red-600">{status.error}</p>
                    </div>
                )}
                <div className="flex flex-row gap-2 justify-between items-center pt-2 pl-2 pr-2">
                    <div className="flex flex-row gap-2 items-center flex-nowrap">
                        {folderPath.map((folder) => {
                            return (
                                <React.Fragment key={folder.path}>
                                    <div>
                                        {folder.name === BUCKET_ASSETS_DIR
                                            ? (
                                                <TooltipWrapper text="Go to the root">
                                                    <ButtonAction
                                                        Icon={LucideHome}
                                                        variant="ghost"
                                                        onClick={handleChangeCurrentPath(folder.path)}
                                                        size="sm"
                                                    />
                                                </TooltipWrapper>
                                            )
                                            : (
                                                <ButtonAction
                                                    Icon={LucideFolder}
                                                    label={folder.name}
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
                            {currentNode.name === BUCKET_ASSETS_DIR
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
                    </div>
                    <div className="flex flex-row gap-2 items-center justify-end flex-nowrap">
                        <AssetsFilesAddFolderButton node={currentNode} onSuccess={reloadData} />
                        <AssetsFilesUploadButton node={currentNode} onUpload={reloadData}/>
                        <AssetsFilesDeleteButton
                            filePaths={Object.keys(selected)}
                            onSuccess={() => {
                                setSelected({});
                                reloadData();
                            }}
                        />
                    </div>
                </div>
                <div className="relative grow">
                    {sortedContent && sortedContent.length > 0
                        ? (
                            <div className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden">
                                {(status.isLoading || status.isUninitialized)
                                    ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <p>Loading...</p>
                                        </div>
                                    )
                                    : (
                                        <ScrollArea
                                            className="h-full w-full border-solid border-slate-200 border-t-[1px]">
                                            <Table className="border-solid border-slate-200 border-b-[1px]">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[40px]"></TableHead>
                                                        <TableHead
                                                            className="flex flex-row items-center flex-nowrap gap-2">
                                                            <div>File Name</div>
                                                            <div><LucideSortAsc className="w-4 h-4"/></div>
                                                        </TableHead>
                                                        <TableHead className="text-right">Size</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {sortedContent?.map((treeNode, itemIndex) => {
                                                        return (
                                                            <TableRow key={treeNode.path}
                                                                      className={itemIndex % 2 ? 'bg-white' : 'bg-slate-50'}>
                                                                <TableCell>
                                                                    {(treeNode.fileObject || treeNode.children.length === 0) && (
                                                                        <Checkbox
                                                                            checked={!!selected[treeNode.path]}
                                                                            onCheckedChange={handleSelectItem(treeNode.path)}
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-row items-center gap-1">
                                                                        {treeNode.fileObject
                                                                            ? (
                                                                                <>
                                                                                    <FileIcon fileName={treeNode.name}/>
                                                                                    <div>{treeNode.name}</div>
                                                                                    <TooltipWrapper
                                                                                        text="Copy the file url to the clipboard">
                                                                                        <CopyToClipboardButton
                                                                                            text={treeNode.fileObject?.url || ''}
                                                                                            size="xs"
                                                                                            variant="outline"
                                                                                        />
                                                                                    </TooltipWrapper>
                                                                                </>
                                                                            )
                                                                            : (
                                                                                <>
                                                                                    {treeNode.children.length > 0
                                                                                        ? (<LucideFolder
                                                                                            className="w-4 h-4"/>)
                                                                                        : (<LucideFolderMinus
                                                                                            className="w-4 h-4"/>)
                                                                                    }
                                                                                    <a
                                                                                        href="#"
                                                                                        onClick={handleChangeCurrentPath(treeNode.path)}
                                                                                        className="hover:underline text-blue-600"
                                                                                    >
                                                                                        {treeNode.name}
                                                                                    </a>
                                                                                </>
                                                                            )
                                                                        }
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {treeNode.fileObject && treeNode.fileObject.size && (
                                                                        <span>{humanReadableBytes(treeNode.fileObject.size)}</span>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    )
                                }
                            </div>
                        )
                        : (
                            <div className="w-full h-full flex flex-row items-center justify-center p-3">
                                <div>
                                    <span className="text-muted-foreground text-sm">There are no files available.</span>
                                </div>
                            </div>
                        )
                    }

                </div>
            </div>
        </Card>
    );
}