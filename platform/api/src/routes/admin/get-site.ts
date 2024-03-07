import {Router, Request, Response} from 'express';
import {DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {getSiteEntry} from 'infra-common/dao/documentDao';
import {getFileContentAsString} from 'infra-common/aws/bucket';
import {PLATFORM_SYSTEM_BUCKET_NAME, BUCKET_DOCUMENTS_DIR} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-site', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        const siteEntry: DI_SiteEntry = await getSiteEntry();
        siteEntry.SiteStyles = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteStyles.css`);
        siteEntry.SiteScripts = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteScripts.html`);
        siteEntry.SiteBodyScripts = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/site/siteBodyScripts.html`);
        res.status(200).json({siteEntry});
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
