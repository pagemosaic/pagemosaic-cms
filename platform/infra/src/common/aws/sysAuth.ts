import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    GetUserCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    ConfirmSignUpCommand,
    AdminGetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {getSysUserPoolConfig} from './sysParameters';

const REGION = process.env.AWS_REGION;

let cognitoClient: CognitoIdentityProviderClient | undefined = undefined;
export async function getCognitoClient(): Promise<CognitoIdentityProviderClient> {
    if (!cognitoClient) {
        cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
    }
    return cognitoClient;
}

export async function authenticateSysUser(username: string, password: string) {
    const sysUserPoolConfig = await getSysUserPoolConfig();
    const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: sysUserPoolConfig.ClientId,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    });
    const client = await getCognitoClient();
    return client.send(command);
}

export async function refreshSysUser(refreshToken: string) {
    const sysUserPoolConfig = await getSysUserPoolConfig();
    const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: sysUserPoolConfig.ClientId,
        AuthParameters: {
            REFRESH_TOKEN: refreshToken,
        },
    });
    const client = await getCognitoClient();
    return client.send(command);
}

export async function forgotSysUser(username: string) {
    const sysUserPoolConfig = await getSysUserPoolConfig();
    const command = new ForgotPasswordCommand({
        ClientId: sysUserPoolConfig.ClientId,
        Username: username
    });
    const client = await getCognitoClient();
    return client.send(command);
}

export async function confirmForgotSysUser(username: string, newPassword: string, verificationCode: string) {
    const sysUserPoolConfig = await getSysUserPoolConfig();
    const command = new ConfirmForgotPasswordCommand({
        ClientId: sysUserPoolConfig.ClientId,
        Username: username,
        ConfirmationCode: verificationCode,
        Password: newPassword
    });
    const client = await getCognitoClient();
    return client.send(command);
}

export async function confirmSignUpSysUser(username: string, verificationCode: string) {
    const sysUserPoolConfig = await getSysUserPoolConfig();
    const command = new ConfirmSignUpCommand({
        ClientId: sysUserPoolConfig.ClientId,
        Username: username,
        ConfirmationCode: verificationCode,
    });
    const client = await getCognitoClient();
    return client.send(command);
}

export async function getUserAttributes(accessToken: string | undefined) {
    const client = await getCognitoClient();
    const getUserCommand = new GetUserCommand({
        AccessToken: accessToken,
    });
    const userResponse = await client.send(getUserCommand);
    let userAttributes: any = {};
    if (userResponse.UserAttributes) {
        userAttributes = userResponse.UserAttributes.reduce((acc, attr) => {
            if (attr.Name) {
                acc[attr.Name] = attr.Value;
            }
            return acc;
        }, userAttributes);
    }
    return userAttributes;
}

export async function getSysUser(username: string) {
    const sysUserPoolConfig = await getSysUserPoolConfig();
    const command = new AdminGetUserCommand({
        UserPoolId: sysUserPoolConfig.UserPoolId,
        Username: username,
    });
    const client = await getCognitoClient();
    return client.send(command);
}
