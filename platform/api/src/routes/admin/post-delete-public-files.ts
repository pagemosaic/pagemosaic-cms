import {Router, Request, Response} from 'express';
import {getPlatformWebsiteUrlParams} from 'infra-common/aws/sysParameters';
import {deleteFiles} from 'infra-common/aws/bucket';
import {invalidatePaths} from 'infra-common/aws/cdn';
import {PLATFORM_PUBLIC_BUCKET_NAME} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-delete-public-files', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.filePaths) {
        res.status(500).send('Missing the file paths in the request');
        return;
    }
    try {
        const {filePaths} = req.body;
        const {entryPointDistributionId} = await getPlatformWebsiteUrlParams();
        await deleteFiles(PLATFORM_PUBLIC_BUCKET_NAME, filePaths);
        await invalidatePaths(entryPointDistributionId, filePaths);
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Deleting files is failed. ${err.message}`);
    }
});

export default router;
