import {getStorageRecord, setStorageRecord} from '@/utils/localStorage';
import {post} from '@/utils/ClientApi';
import {UserToken, AuthRefreshResponse} from 'infra-common/system/Auth';

const delta: number = 15 * 60 * 1000; // 15 minutes

export type AccessToken = string | null;
export type AccessTokenRequest = Promise<AccessToken>;
type UserTokenSingletonInstance = UserToken | null;

export class AccessTokenSingleton {
    private userToken: UserTokenSingletonInstance;
    private initializationPromise: Promise<UserTokenSingletonInstance> | null;

    constructor() {
        this.userToken = null;
        this.initializationPromise = null;
    }

    private async initialize(): Promise<void> {
        const savedUserToken: UserToken | undefined = await getStorageRecord('userToken', 'auth');
        if (savedUserToken) {
            if (this.isExpired(savedUserToken.expiredAt)) {
                let refreshResponse: AuthRefreshResponse | null = null;
                try {
                    refreshResponse = await post<AuthRefreshResponse>('/api/admin/post-sys-user-auth-refresh', {
                        username: savedUserToken.username,
                        refreshToken: savedUserToken.refreshToken
                    });
                    if (refreshResponse && refreshResponse.userToken) {
                        await setStorageRecord(
                            'userToken',
                            {...refreshResponse.userToken, refreshToken: savedUserToken.refreshToken},
                            'auth'
                        );
                        this.userToken = refreshResponse.userToken;
                    }
                } catch (e) {
                    // do nothing: it seems that refresh token is invalid for now
                }
            } else {
                this.userToken = savedUserToken;
            }
        }
    }

    private isExpired(expirationTimeUTC?: number): boolean {
        if (expirationTimeUTC) {
            const expireAt = new Date(expirationTimeUTC);
            return (expireAt.getTime() - Date.now()) < delta;
        }
        return true;
    }

    private async getUserToken(): Promise<UserTokenSingletonInstance> {
        if (this.userToken && !this.isExpired(this.userToken.expiredAt)) {
            return this.userToken;
        }
        if (!this.initializationPromise) {
            this.initializationPromise = this.initialize()
                .then(() => {
                    this.initializationPromise = null;
                    return this.userToken;
                });
        }
        return this.initializationPromise;
    }

    async getAccessToken(): AccessTokenRequest {
        return this.getUserToken().then(userToken => {
            if (userToken) {
                return userToken.accessToken;
            }
            throw Error('[ACCESS_TOKEN_IS_MISSING]');
        });
    }

    clearAccessToken(): void {
        this.userToken = null;
    }
}

export const accessTokenSingleton = new AccessTokenSingleton();
