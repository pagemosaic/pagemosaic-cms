import {Router, Request, Response} from 'express';
import {getPlatformWebsiteUrlParams} from 'infra-common/aws/sysParameters';
import {invalidatePaths} from 'infra-common/aws/cdn';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-invalidate-paths', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.paths) {
        res.status(500).send('Missing the paths list in the request');
        return;
    }
    try {
        const {paths} = req.body;
        const {entryPointDistributionId} = await getPlatformWebsiteUrlParams();
        await invalidatePaths(entryPointDistributionId, paths);
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Files invalidating is failed. ${err.message}`);
    }
});

export default router;
