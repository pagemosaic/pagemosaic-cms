import {Router, Request, Response} from 'express';
import {DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {getIdFromPK} from 'infra-common/utility/database';
import {getTemplateEntriesByKeys} from 'infra-common/dao/documentDao';
import {getFileContentAsString} from 'infra-common/aws/bucket';
import {BUCKET_DOCUMENTS_DIR, DI_TEMPLATE_ENTRY_PREFIX, PLATFORM_SYSTEM_BUCKET_NAME} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-template', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    const templateId = req.query.templateId as string;
    try {
        const foundEntries: Array<DI_TemplateEntry> = await getTemplateEntriesByKeys(
            [{S: `${DI_TEMPLATE_ENTRY_PREFIX}#${templateId}`}],
            ['ENTRY', 'TEMPLATE_META', 'TEMPLATE_CONTENT']
        );
        if (foundEntries.length > 0) {
            const templateEntry = foundEntries[0];
            let templateId = getIdFromPK(templateEntry.Entry?.PK.S);
            templateEntry.Html = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${templateId}/templateHtml.html`);
            templateEntry.Styles = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${templateId}/templateStyles.css`);
            res.status(200).json(templateEntry);
        } else {
            res.status(200).json({});
        }
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
