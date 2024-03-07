import {Router, Request, Response} from 'express';
import {
    copyPageEntry,
    updateGeneratorLastChange,
    getEntryIdsByPageTemplateId,
    copyTemplateEntry
} from 'infra-common/dao/documentDao';
import {getFileContentAsString, writeFileContentAsString} from 'infra-common/aws/bucket';
import {PLATFORM_SYSTEM_BUCKET_NAME, BUCKET_DOCUMENTS_DIR} from 'infra-common/constants';
import {getIdFromPK} from 'infra-common/utility/database';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-create-page', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    const {
        templateId,
        newPageId,
        newTemplateId,
        newTemplateTitle,
        pageRoute
    } = req.body;
    if (!templateId || !newPageId) {
        res.status(500).send('Missing the template id or new page id in the request');
        return;
    }
    if (newTemplateId && !newTemplateTitle) {
        res.status(500).send('Missing the template name in the request');
        return;
    }
    try {
        const pageIds: Array<{S: string}> = await getEntryIdsByPageTemplateId(templateId);
        if (pageIds.length === 0) {
            throw Error('No page was found with the specified template.');
        }
        if (newTemplateId && newTemplateTitle) {
            await copyTemplateEntry(templateId, newTemplateId, newTemplateTitle);
            await copyPageEntry(getIdFromPK(pageIds[0].S), newPageId, pageRoute, newTemplateId);
            const oldHtml = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${templateId}/templateHtml.html`);
            await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${newTemplateId}/templateHtml.html`, oldHtml || '<!doctype html><html></html>', 'text/html');
            const oldStyles = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${templateId}/templateStyles.css`);
            await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${newTemplateId}/templateStyles.css`, oldStyles || '/* no styles */', 'text/css');
        } else {
            await copyPageEntry(getIdFromPK(pageIds[0].S), newPageId, pageRoute);
        }
        await updateGeneratorLastChange(Date.now().toString());
        res.status(200).json({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Making a copy of the page is failed. ${err.message}`);
    }
});

export default router;
