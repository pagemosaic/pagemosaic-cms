export type ItemKey = {
    PK: {S: string};
    SK: {S: string};
};

// used in the table record manipulation methods where we don't need to now the exact fields of the item
// for updating, saving, etc...
export type BasicItem = ItemKey & Record<string, any>;
