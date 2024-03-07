import type {FileObject, TreeNode} from 'infra-common/system/Bucket';

// Helper function to transform list of paths into tree structure
export function listToTree(fileList: Array<FileObject>): Array<TreeNode> {
    const root: Array<TreeNode> = [];
    for (const fileObject of fileList) {
        let currentLevel = root;
        const parts = fileObject.id.split('/');
        let part: string;
        for (let i = 0; i < parts.length; i++) {
            part = parts[i];
            if (part && part.length > 0) {
                const isLastPart = i === parts.length - 1;
                let node = currentLevel.find(node => node.name === part);
                if (!node) {
                    node = {
                        name: part,
                        path: parts.slice(0, i + 1).join('/'),
                        children: [],
                        fileObject: isLastPart ? fileObject : undefined // this is file
                    };
                    if (!isLastPart) {
                        // folder path should ends with slash
                        node.path += '/';
                    }
                    currentLevel.push(node);
                }
                currentLevel = node.children;
            }
        }
    }
    return root;
}

export function setParentReferences(node: TreeNode, parent?: TreeNode): void {
    node.parent = parent;
    for (let child of node.children) {
        setParentReferences(child, node);
    }
}

export function cloneWithParentReferences(tree: TreeNode): TreeNode {
    const serialized = JSON.stringify(tree);
    const newTree: TreeNode = JSON.parse(serialized);
    setParentReferences(newTree);
    return newTree;
}

export function getParentNodes(node: TreeNode): Array<TreeNode> {
    const parents: Array<TreeNode> = [];
    while (node.parent) {
        parents.unshift(node.parent);
        node = node.parent;
    }
    return parents;
}

export function findNodeByPath(root: TreeNode, path: string): TreeNode | undefined {
    if (root.path === path) {
        return root;
    }

    for (const child of root.children) {
        const foundNode = findNodeByPath(child, path);
        if (foundNode) {
            return foundNode;
        }
    }

    return undefined;
}

export function nodesComparator(a1: TreeNode, b1: TreeNode): number {
    if (a1.fileObject && !b1.fileObject) {
        return 1;
    } else if (!a1.fileObject && b1.fileObject) {
        return -1;
    }
    return 0;
}

export const nodesComparatorByName = (direction: 'asc' | 'desc') => (a1: TreeNode, b1: TreeNode): number => {
    if (a1.fileObject && !b1.fileObject) {
        return 1;
    } else if (!a1.fileObject && b1.fileObject) {
        return -1;
    } else {
        if (direction === 'asc') {
            return a1.name.localeCompare(b1.name);
        } else {
            return b1.name.localeCompare(a1.name);
        }
    }
}

export const nodesComparatorByLastModified = (direction: 'asc' | 'desc') => (a1: TreeNode, b1: TreeNode): number => {
    if (a1.fileObject && !b1.fileObject) {
        return 1
    } else if (!a1.fileObject && b1.fileObject) {
        return -1;
    } else if (a1.fileObject?.timestamp && b1.fileObject?.timestamp) {
        if (direction === 'desc') {
            return a1.fileObject.timestamp - b1.fileObject.timestamp;
        } else {
            return b1.fileObject.timestamp - a1.fileObject.timestamp;
        }
    }
    return 0;
}

export const nodesComparatorBySize = (direction: 'asc' | 'desc') => (a1: TreeNode, b1: TreeNode): number => {
    if (a1.fileObject && !b1.fileObject) {
        return 1
    } else if (!a1.fileObject && b1.fileObject) {
        return -1;
    } else if (a1.fileObject?.size && b1.fileObject?.size) {
        if (direction === 'asc') {
            return a1.fileObject.size - b1.fileObject.size;
        } else {
            return b1.fileObject.size - a1.fileObject.size;
        }
    }
    return 0;
}
