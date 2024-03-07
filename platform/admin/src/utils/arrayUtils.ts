const arrayMoveMutate = (array: Array<any>, from: number, to: number) => {
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
};

export const arrayMove = (array: Array<any>, from: number, to: number): Array<any> => {
  array = array.slice();
  arrayMoveMutate(array, from, to);
  return array;
};

export function shiftAndPush<T>(arr: T[], newItem: T, maxSize: number): T[] {
  if (arr.length >= maxSize) {
    arr.shift();
  }
  arr.push(newItem);
  return arr;
}
