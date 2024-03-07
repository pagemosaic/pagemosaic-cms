import {Router, Request, Response} from 'express';
import {BasicItem} from 'infra-common/data/BasicItem';
import {createOrUpdateItem} from 'infra-common/aws/database';
import {
    PLATFORM_DOCUMENTS_TABLE_NAME,
    BUCKET_DOCUMENTS_DIR,
    PLATFORM_SYSTEM_BUCKET_NAME
} from 'infra-common/constants';
import {DI_TemplateEntry} from 'infra-common/data/DocumentItem';
import {writeFileContentAsString} from 'infra-common/aws/bucket';
import {getIdFromPK} from 'infra-common/utility/database';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {updateGeneratorLastChange} from 'infra-common/dao/documentDao';

const router = Router();

router.post('/post-template', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.template) {
        res.status(500).send('Missing the template entry data in the request');
        return;
    }
    try {
        const {Entry, Meta, Content, Html, Styles} = req.body.template as DI_TemplateEntry;
        if (Entry) {
            const templateId = getIdFromPK(Entry.PK.S);

            Entry.EntryUpdateDate.N = Date.now().toString();
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Entry);
            if (Meta) await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Meta);
            if (Content) await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Content);
            await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${templateId}/templateHtml.html`, Html || '<!doctype html><html></html>', 'text/html');
            await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${templateId}/templateStyles.css`, Styles || '/* no styles */', 'text/css');
            await updateGeneratorLastChange(Entry.EntryUpdateDate.N);
        }
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Updating template entry data is failed. ${err.message}`);
    }
});

export default router;
