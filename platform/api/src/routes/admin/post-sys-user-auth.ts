import {Router, Request, Response} from 'express';
import {authenticateSysUser, getUserAttributes} from 'infra-common/aws/sysAuth';
import {AuthResponse} from 'infra-common/system/Auth';

const router = Router();

router.post('/post-sys-user-auth', async (req: Request, res: Response) => {
    if (!req.body.username) {
        res.status(500).send('Missing the username in the request');
        return;
    }
    if (!req.body.password) {
        res.status(500).send('Missing the password in the request');
        return;
    }
    try {
        const {username, password} = req.body;
        const response = await authenticateSysUser(username, password);
        if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            res.status(200).json({
                username,
                code: 'change_password',
                sessionData: response.Session,
                requiredAttributes: response.ChallengeParameters
            });
        } else if (response.AuthenticationResult) {
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
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Authentication error. ${err.message}`);
    }
});

export default router;
