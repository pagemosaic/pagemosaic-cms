import {Router, Request, Response} from 'express';
import {copyPageEntry, updateGeneratorLastChange} from 'infra-common/dao/documentDao';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-copy-page', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.pageId || !req.body.newPageId) {
        res.status(500).send('Missing the page ids in the request');
        return;
    }
    try {
        const {pageId, newPageId, pageRoute} = req.body;
        await copyPageEntry(pageId, newPageId, pageRoute);
        await updateGeneratorLastChange(Date.now().toString());
        res.status(200).json({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Making a copy of the page is failed. ${err.message}`);
    }
});

export default router;
