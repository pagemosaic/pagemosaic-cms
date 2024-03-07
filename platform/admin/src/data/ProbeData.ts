import {accessTokenSingleton, AccessToken} from '@/utils/AccessTokenSingleton';
import {get} from '@/utils/ClientApi';

export type ProbeData = {name: string} | null;
export type ProbeDataRequest = Promise<ProbeData>;

class ProbeDataSingleton {
    private instance: ProbeData;
    private initializationPromise: ProbeDataRequest | undefined;
    private expirationPeriod: number;
    private expirationTime: number | undefined;
    constructor(expirationPeriod: number) {
        this.instance = null;
        this.initializationPromise = undefined;
        this.expirationPeriod = expirationPeriod; // in milliseconds
        this.expirationTime = undefined;
    }

    private async initialize(): ProbeDataRequest {
        const accessToken: AccessToken = await accessTokenSingleton.getAccessToken();
        if (accessToken) {
            return get<ProbeData>('/api/admin/get-probe-data');
        }
        throw Error('Missing access token');
    }

    private hasExpired(): boolean {
        return !this.expirationTime || Date.now() > this.expirationTime;
    }

    async getData(): ProbeDataRequest {
        if (this.instance && !this.hasExpired()) {
            return this.instance;
        }
        if (!this.initializationPromise) {
            this.initializationPromise = this.initialize().then((instance: ProbeData) => {
                this.instance = instance;
                this.expirationTime = Date.now() + this.expirationPeriod;
                this.initializationPromise = undefined;
                return instance;
            });
        }
        return this.initializationPromise;
    }
}

// Usage
const expirationPeriod = 5000; // 5 seconds for demonstration
export const probeDataSingleton = new ProbeDataSingleton(expirationPeriod);
