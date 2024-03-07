const regex = /\.([\w-]+)/g;

export const extractClassNames = (cssContent: string): Array<string> => {
    let match;
    const classNames = new Set<string>();
    while ((match = regex.exec(cssContent)) !== null) {
        classNames.add(match[1]); // Add the class name without the dot
    }

    return Array.from(classNames);
};
