export type BucketParams = {
    bucketName: string;
    entryPointDomain: string;
};

export type FileObject = {
    id: string;
    url: string;
    defaultUrl: string;
    size?: number;
    timestamp?: number;
};

export interface TreeNode {
    isRoot?: boolean;
    name: string;
    path: string;
    children: Array<TreeNode>;
    fileObject?: FileObject;
    parent?: TreeNode;
}
