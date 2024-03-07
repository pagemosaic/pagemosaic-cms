import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {getPreviewPointDomain} from 'infra-common/aws/sysParameters';

const router = Router();

router.get('/get-preview', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        const previewPointDomain = await getPreviewPointDomain();
        res.status(200).json({
            domain: previewPointDomain
        });
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
