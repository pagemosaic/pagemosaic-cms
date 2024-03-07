import {PublicBucketStaticData} from '@/data/PublicBucketData';
import React, {useMemo, useState, useEffect} from 'react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {
    LucideHome,
    LucideFolder,
    LucideChevronRight,
    LucideSortAsc,
    LucideFolderMinus,
    LucideX
} from 'lucide-react';
import {ActionDataRequestError} from '@/components/utils/ActionDataRequestError';
import {useNavigate} from 'react-router-dom';
import {UploadButton} from '@/features/filesFinder/UploadButton';
import {findNodeByPath, getParentNodes, nodesComparatorByName} from '@/utils/FileObjectUtils';
import {TreeNode} from 'infra-common/system/Bucket';
import {AsyncStatusError} from '@/components/utils/AsyncStatusError';
import {AddFolderButton} from '@/features/filesFinder/AddFolderButton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow, TableFooter,
} from '@/components/ui/table';
import {Card} from '@/components/ui/card';
import {humanReadableBytes, getTimeDistance} from '@/utils/FormatUtils';
import {Checkbox} from '@/components/ui/checkbox';
import {ScrollArea} from '@/components/ui/scroll-area';
import {DeleteFilesButton} from '@/features/filesFinder/DeleteFilesButton';
import {useSessionState} from '@/utils/localStorage';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {BUCKET_STATIC_DIR} from 'infra-common/constants';
import {TooltipWrapper} from '@/components/utils/TooltipWrapper';
import {MainSubSection} from '@/components/layouts/MainSubSection';
import {CopyToClipboardButton} from '@/components/utils/CopyToClipboardButton';
import {FileIcon} from '@/components/utils/FileIcon';
import {FileObjectPreview} from '@/components/utils/FileObjectPreview';

interface FilesFinderProps {
    publicBucketData: PublicBucketStaticData;
}

export function FilesFinder(props: FilesFinderProps) {
    const {publicBucketData} = props;
    const {actionData} = useActionForm();
    const navigate = useNavigate();
    const {
        value: currentPath = `${BUCKET_STATIC_DIR}/`,
        saveValue: setCurrentPath
    } = useSessionState<string>('fileBrowserCurrentPath');
    const [selected, setSelected] = useState<Record<string, boolean>>({});

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

    useEffect(() => {
        setSelected({});
    }, [currentNode]);

    let folderPath: Array<TreeNode> = currentNode ? getParentNodes(currentNode) : [];
    if (folderPath.length > 3) {
        folderPath = folderPath.slice(-3);
    }

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

    const handleClose = () => {
        navigate(-1);
    };

    let totalSize = 0;
    let sortedContent = currentNode.children.sort(nodesComparatorByName('asc'));

    return (
        <MainSubSection>
            <div className="w-full h-full p-4 flex flex-col gap-2">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row gap-2 items-center">
                        <div>
                            <p className="text-xl">
                                <span className="text-muted-foreground mr-2">Files in:</span>
                                <span>{currentNode.name === BUCKET_STATIC_DIR ? '/' : currentNode.name}</span>
                                {currentNode.name === BUCKET_STATIC_DIR && (
                                    <span className="ml-2 text-muted-foreground">(root folder)</span>
                                )}
                            </p>
                        </div>
                        <ActionDataRequestError actionData={actionData}/>
                        <AsyncStatusError/>
                    </div>
                    <div>
                        <ButtonAction
                            onClick={handleClose}
                            variant="ghost"
                            size="sm"
                            Icon={LucideX}
                            label="Close"
                        />
                    </div>
                </div>
                <div className="flex flex-row gap-2 items-center flex-nowrap justify-between">
                    <div className="flex flex-row gap-2 items-center flex-nowrap">
                        {folderPath.map((folder) => {
                            return (
                                <React.Fragment key={folder.path}>
                                    <div>
                                        {folder.name === BUCKET_STATIC_DIR
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
                            <AddFolderButton node={currentNode}/>
                        </div>
                        <div>
                            <UploadButton node={currentNode}/>
                        </div>
                        <div>
                            <DeleteFilesButton filePaths={Object.keys(selected)}/>
                        </div>
                    </div>
                    <div>
                        {/*<DeleteFilesButton filePaths={Object.keys(selected)}/>*/}
                    </div>
                </div>
                <div className="relative grow">
                    <Card className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden">
                        <ScrollArea className="w-full h-full">
                            <Table>
                                <TableHeader>
                                    <tr>
                                        <TableHead className="w-[40px]"></TableHead>
                                        <TableHead className="flex flex-row items-center flex-nowrap gap-2">
                                            <div>File Name</div>
                                            <div><LucideSortAsc className="w-4 h-4"/></div>
                                        </TableHead>
                                        <TableHead className="w-[200px]">Last Modified</TableHead>
                                        <TableHead className="text-right w-[150px]">Size</TableHead>
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {sortedContent.map((treeNode, itemIndex) => {
                                        if (treeNode.fileObject && treeNode.fileObject.size) {
                                            totalSize += treeNode.fileObject.size;
                                        }
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
                                                <TableCell className="flex flex-row items-center gap-2 flex-nowrap">
                                                    {treeNode.fileObject
                                                        ? (
                                                            <>
                                                                <FileIcon fileName={treeNode.name}/>
                                                                <div><FileObjectPreview fileObject={treeNode.fileObject} label={treeNode.name} /></div>
                                                                <TooltipWrapper text="Copy the file url to the clipboard">
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
                                                        )
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {treeNode.fileObject && (
                                                        <span>{getTimeDistance(treeNode.fileObject.timestamp)}</span>
                                                    )}
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
                                <TableFooter>
                                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                                        <TableCell></TableCell>
                                        <TableCell colSpan={2}>Total</TableCell>
                                        <TableCell className="text-right">{humanReadableBytes(totalSize)}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </ScrollArea>
                    </Card>
                </div>
            </div>
        </MainSubSection>
    );
}