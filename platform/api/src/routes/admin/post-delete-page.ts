import {Router, Request, Response} from 'express';
import {
    deletePageEntry,
    updateGeneratorLastChange,
    getEntryIdsByPageTemplateId,
    erasePageEntry
} from 'infra-common/dao/documentDao';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-delete-page', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.pageId) {
        res.status(500).send('Missing the page id in the request');
        return;
    }
    if (!req.body.templateId) {
        res.status(500).send('Missing the template id in the request');
        return;
    }
    try {
        const {pageId, templateId} = req.body;
        const foundPages = await getEntryIdsByPageTemplateId(templateId);
        if (foundPages.length > 2) {
            await erasePageEntry(pageId);
        } else {
            await deletePageEntry(pageId);
        }
        await updateGeneratorLastChange(Date.now().toString());
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Deleting of the page is failed. ${err.message}`);
    }
});

export default router;
