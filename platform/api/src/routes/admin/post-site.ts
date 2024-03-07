import {Router, Request, Response} from 'express';
import {createOrUpdateItem} from 'infra-common/aws/database';
import {PLATFORM_DOCUMENTS_TABLE_NAME, PLATFORM_SYSTEM_BUCKET_NAME, BUCKET_DOCUMENTS_DIR} from 'infra-common/constants';
import {DI_SiteEntry, DI_SiteContentSlice, DI_EntrySlice} from 'infra-common/data/DocumentItem';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {updateGeneratorLastChange} from 'infra-common/dao/documentDao';
import {writeFileContentAsString} from 'infra-common/aws/bucket';

const router = Router();

router.post('/post-site', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.site) {
        res.status(500).send('Missing the site entry data in the request');
        return;
    }
    try {
        const site: DI_SiteEntry = req.body.site;
        const {Entry, SiteContent, SiteScripts, SiteBodyScripts, SiteStyles} = site;
        if (Entry && SiteContent) {
            Entry.EntryUpdateDate.N = Date.now().toString();
            await createOrUpdateItem<DI_EntrySlice>(PLATFORM_DOCUMENTS_TABLE_NAME, Entry);
            await createOrUpdateItem<DI_SiteContentSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, SiteContent);
            await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteScripts.html`, SiteScripts || '', 'text/html');
            await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteBodyScripts.html`, SiteBodyScripts || '', 'text/html');
            await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteStyles.css`, SiteStyles || '', 'text/css');
            await updateGeneratorLastChange(Entry.EntryUpdateDate.N);
        }
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Updating site config is failed. ${err.message}`);
    }
});

export default router;
