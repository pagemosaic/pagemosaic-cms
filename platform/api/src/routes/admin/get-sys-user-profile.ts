import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {UserProfile} from 'infra-common/data/SysUser';
import {getItemByKey} from 'infra-common/aws/database';
import {PLATFORM_SYSTEM_TABLE_NAME} from 'infra-common/constants';

const router = Router();

router.get('/get-sys-user-profile', async (req: Request, res: Response) => {
    let decodedToken;
    try {
        decodedToken = await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    const userProfile: UserProfile | undefined = await getItemByKey<UserProfile>(
        PLATFORM_SYSTEM_TABLE_NAME, {
            PK: {S: `User_${decodedToken.sub}`},
            SK: {S: `Profile_${decodedToken.sub}`}
        }
    );
    res.status(200).json(userProfile || {});
});

export default router;
