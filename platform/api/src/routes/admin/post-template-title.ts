import {Router, Request, Response} from 'express';
import {BasicItem} from 'infra-common/data/BasicItem';
import {createOrUpdateItem} from 'infra-common/aws/database';
import {
    PLATFORM_DOCUMENTS_TABLE_NAME,
    DI_TEMPLATE_ENTRY_PREFIX
} from 'infra-common/constants';
import {DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {getTemplateEntriesByKeys} from 'infra-common/dao/documentDao';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-template-title', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.templateId) {
        res.status(500).send('Missing the template id in the request');
        return;
    }
    if (!req.body.newTitle) {
        res.status(500).send('Missing the template new title in the request');
        return;
    }
    const {templateId, newTitle} = req.body;
    try {
        const foundEntries: Array<DI_TemplateEntry> = await getTemplateEntriesByKeys(
            [{S: `${DI_TEMPLATE_ENTRY_PREFIX}#${templateId}`}],
            ['TEMPLATE_META']
        );
        if (foundEntries.length > 0) {
            const {Meta} = foundEntries[0];
            if (Meta) {
                Meta.TemplateTitle.S = newTitle;
                await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Meta);
            }
        }
        res.status(200).json({});
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
