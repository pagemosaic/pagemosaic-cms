import {Router, Request, Response} from 'express';
import {createOrUpdateItem, deleteItemByKey} from 'infra-common/aws/database';
import {PLATFORM_DOCUMENTS_TABLE_NAME, PLATFORM_SYSTEM_BUCKET_NAME, BUCKET_DOCUMENTS_DIR} from 'infra-common/constants';
import {
    DI_SiteEntry,
    DI_SiteContentSlice,
    DI_EntrySlice,
    DI_SitePartialContentSlice
} from 'infra-common/data/DocumentItem';
import {updateGeneratorLastChange, getSiteEntry} from 'infra-common/dao/documentDao';
import {writeFileContentAsString} from 'infra-common/aws/bucket';
import {verifyAuthentication} from '../../utility/RequestUtils';

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
        const {Entry, SiteContent, SitePartials, SiteScripts, SiteBodyScripts, SiteStyles} = site;
        if (Entry && SiteContent) {
            const prevSiteEntry: DI_SiteEntry = await getSiteEntry();
            Entry.EntryUpdateDate.N = Date.now().toString();
            await createOrUpdateItem<DI_EntrySlice>(PLATFORM_DOCUMENTS_TABLE_NAME, Entry);
            await createOrUpdateItem<DI_SiteContentSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, SiteContent);
            if (SitePartials && SitePartials.length > 0) {
                let foundSitePartialIndex = -1;
                for (const sitePartial of SitePartials) {
                    await createOrUpdateItem<DI_SitePartialContentSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, sitePartial);
                    foundSitePartialIndex = prevSiteEntry.SitePartials.findIndex(i => i.SitePartialKey.S === sitePartial.SitePartialKey.S);
                    if (foundSitePartialIndex >= 0) {
                        prevSiteEntry.SitePartials.splice(foundSitePartialIndex, 1);
                    }
                }
                for (const prevSitePartial of prevSiteEntry.SitePartials) {
                    await deleteItemByKey(PLATFORM_DOCUMENTS_TABLE_NAME, {
                        PK: prevSitePartial.PK,
                        SK: prevSitePartial.SK
                    });
                }
            }
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
