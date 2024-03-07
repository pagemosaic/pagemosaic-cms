import {Router, Request, Response} from 'express';
import {refreshSysUser} from 'infra-common/aws/sysAuth';
import {AuthRefreshResponse} from 'infra-common/system/Auth';

const router = Router();

router.post('/post-sys-user-auth-refresh', async (req: Request, res: Response) => {
    if (!req.body.username) {
        res.status(500).send('Missing the username in the request');
        return;
    }
    if (!req.body.refreshToken) {
        res.status(500).send('Missing the refreshToken in the request');
        return;
    }
    try {
        const {username, refreshToken} = req.body;
        const response = await refreshSysUser(refreshToken);
        if (response.AuthenticationResult) {
            const result: AuthRefreshResponse = {
                userToken: {
                    accessToken: response.AuthenticationResult.AccessToken || '',
                    refreshToken: '', // you don't receive a new refresh token because the existing one is still valid.
                    username,
                    expiredAt: Date.now() + ((response.AuthenticationResult?.ExpiresIn || 0) * 1000),
                }
            };
            res.status(200).json(result);
        } else {
            // Handle any other response scenarios
            res.status(500).send('Unexpected response from Cognito');
        }
    } catch (e: any) {
        console.error(e);
        res.status(500).send(`Auth error: ${e.message}`);
    }
});

export default router;
