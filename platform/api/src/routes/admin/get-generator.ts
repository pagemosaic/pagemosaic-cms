import {Router, Request, Response} from 'express';
import {getGenerator} from 'infra-common/dao/documentDao';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-generator', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        res.status(200).json(await getGenerator());
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
