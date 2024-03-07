import {Router, Request, Response} from 'express';
import {BasicItem} from 'infra-common/data/BasicItem';
import {createOrUpdateItem} from 'infra-common/aws/database';
import {PLATFORM_DOCUMENTS_TABLE_NAME} from 'infra-common/constants';
import {DI_PageEntry} from 'infra-common/data/DocumentItem';
import {updateGeneratorLastChange} from 'infra-common/dao/documentDao';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-page', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.page) {
        res.status(500).send('Missing the page entry data in the request');
        return;
    }
    try {
        const {Entry: PageEntry, Content, Meta, Article} = req.body.page as DI_PageEntry;
        if (PageEntry) {
            PageEntry.EntryUpdateDate.N = Date.now().toString();
            await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, PageEntry);
            if (Meta) await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Meta);
            if (Content) await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Content);
            if (Article) await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, Article);
            await updateGeneratorLastChange(PageEntry.EntryUpdateDate.N);
        }
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Updating page entry data is failed. ${err.message}`);
    }
});

export default router;
