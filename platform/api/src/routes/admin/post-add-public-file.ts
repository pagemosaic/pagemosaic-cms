import {Router, Request, Response} from 'express';
import {getUploadUrlForFile, shouldUpload} from 'infra-common/aws/bucket';
import {PLATFORM_PUBLIC_BUCKET_NAME} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-add-public-file', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.filePath) {
        res.status(500).send('Missing the file path in the request');
        return;
    }
    try {
        const {filePath, contentHash} = req.body;
        if (contentHash) {
            const isContentDifferent = await shouldUpload(PLATFORM_PUBLIC_BUCKET_NAME, filePath, contentHash);
            if (!isContentDifferent) {
                res.status(200).send({});
                return;
            }
        }
        const url = await getUploadUrlForFile(PLATFORM_PUBLIC_BUCKET_NAME, filePath, contentHash);
        res.status(200).send({url});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Uploading file is failed. ${err.message}`);
    }
});

export default router;
