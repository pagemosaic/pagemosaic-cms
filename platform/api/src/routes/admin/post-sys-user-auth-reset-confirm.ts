import {Router, Request, Response} from 'express';
import {confirmForgotSysUser, authenticateSysUser, getUserAttributes} from 'infra-common/aws/sysAuth';
import {AuthResponse} from 'infra-common/system/Auth';

const router = Router();

router.post('/post-sys-user-auth-reset-confirm', async (req: Request, res: Response) => {
    const { username, newPassword, verificationCode } = req.body;
    if (!username || !newPassword || !verificationCode) {
        res.status(500).send('Missing required fields in the request');
        return;
    }
    try {
        await confirmForgotSysUser(username, newPassword, verificationCode);
        const response = await authenticateSysUser(username, newPassword);
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
    } catch (e: any) {
        res.status(500).send(`Auth error: ${e.message}`);
    }
});

export default router;
