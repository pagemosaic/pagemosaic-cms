import {getStorageRecord, setStorageRecord} from '@/utils/localStorage';
import {UserAttributes, UserToken} from 'infra-common/system/Auth';

export type SysUserData = {
    userAttributes?: UserAttributes,
    userToken?: UserToken;
};
export type SysUserDataRequest = Promise<SysUserData>;

class SysUserDataSingleton {
    private getDataPromise: SysUserDataRequest | undefined;

    constructor() {
        this.getDataPromise = undefined;
    }

    private async initializeGetData(): SysUserDataRequest {
        const userAttributes: any = await getStorageRecord('userAttributes', 'auth');
        const userToken: any = await getStorageRecord('userToken', 'auth');
        return {
            userAttributes,
            userToken
        };
    }

    async getData(): SysUserDataRequest {
        if (!this.getDataPromise) {
            this.getDataPromise = this.initializeGetData().then((instance: SysUserData) => {
                this.getDataPromise = undefined;
                return instance;
            });
        }
        return this.getDataPromise;
    }

    async setData(sysUserData: SysUserData): Promise<void> {
        await setStorageRecord('userAttributes', sysUserData.userAttributes, 'auth');
        await setStorageRecord('userToken', sysUserData.userToken, 'auth');
    }

    async clearData(): Promise<void> {
        await setStorageRecord('userAttributes', null, 'auth');
        await setStorageRecord('userToken', null, 'auth');
    }
}

export const sysUserDataSingleton = new SysUserDataSingleton();
