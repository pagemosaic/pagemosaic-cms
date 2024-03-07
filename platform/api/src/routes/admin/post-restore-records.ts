import {Router, Request, Response} from 'express';
import {putItemsInBatches} from 'infra-common/aws/database';
import {PLATFORM_DOCUMENTS_TABLE_NAME} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-restore-records', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.documents) {
        res.status(500).send('Missing the documents data in the request');
        return;
    }
    try {

        await putItemsInBatches(PLATFORM_DOCUMENTS_TABLE_NAME, req.body.documents);
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Restoring documents data is failed. ${err.message}`);
    }
});

export default router;
