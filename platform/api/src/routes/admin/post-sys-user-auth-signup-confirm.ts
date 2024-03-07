import {Router, Request, Response} from 'express';
import {getSysUser, confirmSignUpSysUser, authenticateSysUser, getUserAttributes} from 'infra-common/aws/sysAuth';
import {AuthResponse} from 'infra-common/system/Auth';

const router = Router();

router.post('/post-sys-user-auth-signup-confirm', async (req: Request, res: Response) => {
    const { username, password, verificationCode } = req.body;
    if (!username || !password || !verificationCode) {
        res.status(500).send('Missing required fields in the request');
        return;
    }
    try {
        let sysUser = await getSysUser(username);
        if (sysUser.UserStatus === 'UNCONFIRMED') {
            await confirmSignUpSysUser(username, verificationCode);
            sysUser = await getSysUser(username);
        }
        if (sysUser.UserStatus === 'CONFIRMED') {
            const response = await authenticateSysUser(username, password);
            if (response.AuthenticationResult) {
                const userToken = response.AuthenticationResult.AccessToken;
                let userAttributes: any = await getUserAttributes(userToken);
                const result: AuthResponse = {
                    userToken: {
                        accessToken: response.AuthenticationResult?.AccessToken || '',
                        refreshToken: response.AuthenticationResult?.RefreshToken || '',
                        expiredAt: Date.now() + ((response.AuthenticationResult?.ExpiresIn || 0) * 1000),
                        username,
                    },
                    userAttributes,
                };
                res.status(200).json(result);
            } else {
                res.status(500).send('Authentication response is empty.');
            }
        } else {
            res.status(500).send(`Your account has incorrect status: ${sysUser.UserStatus}`);
        }
    } catch (e: any) {
        res.status(500).send(`Auth error: ${e.message}`);
    }
});

export default router;
