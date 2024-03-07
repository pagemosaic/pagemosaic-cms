import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {UserProfile} from 'infra-common/data/SysUser';
import {createOrUpdateItem} from 'infra-common/aws/database';
import {PLATFORM_SYSTEM_TABLE_NAME} from 'infra-common/constants';

const router = Router();

router.post('/post-sys-user-profile', async (req: Request, res: Response) => {
    let decodedToken;
    try {
        decodedToken = await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.profile) {
        res.status(500).send('Missing the profile data in the request');
        return;
    }
    try {
        const sysUserProfile: UserProfile = req.body.profile;
        if (!sysUserProfile.PK.S || sysUserProfile.PK.S.length === 0) {
            sysUserProfile.PK.S = `User_${decodedToken.sub}`;
            sysUserProfile.SK.S = `Profile_${decodedToken.sub}`;
        }
        await createOrUpdateItem<UserProfile>(PLATFORM_SYSTEM_TABLE_NAME, sysUserProfile);
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Updating user profile is failed. ${err.message}`);
    }
});

export default router;
