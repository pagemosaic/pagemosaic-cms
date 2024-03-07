import {ItemKey} from './BasicItem';

export type UserProfile = ItemKey & {
    UserEmail: {S: string};
    UserFullName: {S: string};
};
