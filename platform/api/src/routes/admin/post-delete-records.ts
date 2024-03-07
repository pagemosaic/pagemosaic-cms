import {Router, Request, Response} from 'express';
import {scanWithExponentialBackoff, deleteItemsInBatches} from 'infra-common/aws/database';
import {PLATFORM_DOCUMENTS_TABLE_NAME} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-delete-records', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        const documentsRecords = await scanWithExponentialBackoff({TableName: PLATFORM_DOCUMENTS_TABLE_NAME});
        if (documentsRecords && documentsRecords.length > 0) {
            await deleteItemsInBatches(PLATFORM_DOCUMENTS_TABLE_NAME, documentsRecords);
        }
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Deleting documents is failed. ${err.message}`);
    }
});

export default router;
