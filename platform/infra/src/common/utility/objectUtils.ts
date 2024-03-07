export function cloneDeep(object: any): any {
    if (object) {
        const jsonText: string = JSON.stringify(object);
        return JSON.parse(jsonText);
    }
    return object;
}

export function arrayMove(array: Array<any>, from: number, to: number) {
    array = array.slice();
    array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
    return array;
}

export function cleanSet(source: any, keys: string, update: any): any {
    const keysArr: Array<string> = keys.split && (keys.split('.'));

    let next = copy(source),
        last = next,
        i = 0,
        l = keysArr.length;

    for (; i < l; i++) {
        last = last[keysArr[i]] =
            i === l - 1
                ? update && !!update.call
                    ? update(last[keysArr[i]])
                    : update
                : copy(last[keysArr[i]]);
    }

    return next;
}

export function copy(source: any): any {
    let to: any = source && !!source.pop ? [] : {};
    for (let i in source) to[i] = source[i];
    return to;
}

export function filterByKey<T>(objects: Record<string, T>, test: (key: string) => boolean): Array<T> {
    const foundTuples: Array<[string, T]> = Object.entries(objects).filter(i => test(i[0]));
    return foundTuples.map((tuple) => tuple[1]);
}
