import {Router, Request, Response} from 'express';
import {DI_EntrySlice, DI_SiteEntry} from 'infra-common/data/DocumentItem';
import {getEntrySliceByEntryType} from 'infra-common/dao/documentDao';
import {DI_SITE_ENTRY_TYPE} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-site-entry', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        let foundEntries: Array<DI_EntrySlice> = await getEntrySliceByEntryType({S: DI_SITE_ENTRY_TYPE});
        if (foundEntries.length > 0) {
            const siteEntry: DI_SiteEntry = {
                Entry: foundEntries[0],
                SitePartials: []
            };
            res.status(200).json(siteEntry);
        } else {
            res.status(200).json({});
        }
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
