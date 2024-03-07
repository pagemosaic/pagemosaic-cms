export type AuthRequest = {
    username: string;
    password: string;
}

export type AuthResponse = {
    userAttributes?: UserAttributes;
    requiredAttributes?: any;
    sessionData?: any;
    code?: 'change_password' | 'reset_password';
    userToken?: UserToken;
    username?: string;
};

export type AuthRefreshResponse = {
    userToken?: UserToken;
};

export type UserAttributes = {
    'name': string;
    'email': string;
};

export type UserToken = {
    accessToken: string;
    refreshToken: string;
    expiredAt: number;
    username: string;
};
