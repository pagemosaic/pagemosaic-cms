import jwt, { VerifyErrors, JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import {getSysUserPoolConfig} from 'infra-common/aws/sysParameters';

const REGION = process.env.AWS_REGION;

let client: JwksClient | undefined = undefined;

async function getClient(): Promise<JwksClient> {
    if (!client) {
        const sysUserPoolConfig = await getSysUserPoolConfig();
        client = jwksClient({
            jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${sysUserPoolConfig.UserPoolId}/.well-known/jwks.json`,
        });
    }
    return client;
}

export function getKey(header: JwtHeader, callback: SigningKeyCallback): void {
    getClient()
        .then((client: JwksClient) => {
            client.getSigningKey(header.kid!, function(err, key) {
                const signingKey = key?.getPublicKey();
                callback(null, signingKey!);
            });
        });
}

export async function verifyToken(token: string) {
    return new Promise<{ isValidToken: boolean, decodedToken: any }>((resolve) => {
        jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err: VerifyErrors | null, decoded: unknown) => {
            if (err) {
                resolve({ isValidToken: false, decodedToken: null });
            } else {
                resolve({ isValidToken: true, decodedToken: decoded });
            }
        });
    });
}
