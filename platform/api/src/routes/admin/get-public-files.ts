import {Router, Request, Response} from 'express';
import {getPublicBucketParams} from 'infra-common/aws/sysParameters';
import {FileObject} from 'infra-common/system/Bucket';
import {getFilesInDirectory} from 'infra-common/aws/bucket';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-public-files', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.query.dirName) {
        res.status(500).send('Missing directory name in the request.');
        return;
    }
    const dirName = req.query.dirName as string;
    try {
        const bucketParams = await getPublicBucketParams();
        const publicFiles: Array<FileObject> = await getFilesInDirectory(bucketParams, dirName);
        res.status(200).send(publicFiles);
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
