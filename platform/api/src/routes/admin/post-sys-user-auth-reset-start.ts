import { Router, Request, Response } from 'express';
import {forgotSysUser} from 'infra-common/aws/sysAuth';

const router = Router();

router.post('/post-sys-user-auth-reset-start', async (req: Request, res: Response) => {
    if (!req.body.username) {
        res.status(500).send('Missing the username in the request');
        return;
    }
    try {
        const { username } = req.body;
        await forgotSysUser(username);
        res.status(200).json({ message: 'Password reset started successfully.' });
    } catch (e: any) {
        console.error(e);
        res.status(500).send(`Auth error: ${e.message}`);
    }
});

export default router;
