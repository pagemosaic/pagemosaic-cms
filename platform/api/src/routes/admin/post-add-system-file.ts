import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {writeFileContentAsString} from 'infra-common/aws/bucket';
import {PLATFORM_SYSTEM_BUCKET_NAME} from 'infra-common/constants';

const router = Router();

router.post('/post-add-system-file', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.file) {
        res.status(500).send('Missing the file data in the request');
        return;
    }
    try {
        const {filePath, fileBody, fileContentType} = req.body.file;
        await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, filePath, fileBody, fileContentType);
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Writing file is failed. ${err.message}`);
    }
});

export default router;
