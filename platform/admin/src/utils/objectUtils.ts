export function getObjectPaths(obj: any, path: Array<string> = []): Array<string> {
    let paths: Array<string> = [];

    if (obj !== null && typeof obj === 'object') {
        // If the object is not empty, add the path leading to it (for non-root objects)
        if (path.length > 0 && Object.keys(obj).length > 0) {
            paths.push(path.join('.'));
        }

        for (const [key, value] of Object.entries(obj)) {
            // For objects and arrays, continue to build the path recursively
            if (value !== null && typeof value === 'object') {
                paths = paths.concat(getObjectPaths(value, path.concat(key)));
            } else {
                // For primitive values, add the current path to the list
                paths.push(path.concat(key).join('.'));
            }
        }
    } else {
        // Handle the case where the initial input is not an object
        paths.push(path.join('.'));
    }

    return paths;
}

export function createSafeRecord<I ,T extends Record<string, I>>(initialRecord: Partial<T> = {}, inst: I): T {
    return new Proxy(initialRecord as T, {
        get: function(target, name: string) {
            return name in target ? target[name] : inst;
        }
    });
}
