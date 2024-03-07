import {Request} from 'express';
import {verifyToken} from './SysUserTokenUtils';

export async function verifyAuthentication(req: Request): Promise<any> {
    const token = req.headers.xtoken as string;
    if (!token) {
        throw Error('Missing auth token in the request.');
    }
    const {isValidToken, decodedToken} = await verifyToken(token);
    if (!isValidToken) {
        throw Error('Unauthorized');
    }
    return decodedToken;
}
