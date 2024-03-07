import {Router, Request, Response} from 'express';
import {DI_EntrySlice} from 'infra-common/data/DocumentItem';
import {getEntrySliceByEntryType, getPageEntriesByKeys} from 'infra-common/dao/documentDao';
import {DI_PAGE_ENTRY_TYPE} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-full-pages', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        let foundEntries: Array<DI_EntrySlice> = await getEntrySliceByEntryType({S: DI_PAGE_ENTRY_TYPE});
        if (foundEntries.length > 0) {
            const pagesEntries = await getPageEntriesByKeys(
                foundEntries.map(i => i.PK),
                ['ENTRY', 'PAGE_META',  'PAGE_CONTENT', 'PAGE_ARTICLE']
            );
            res.status(200).json(pagesEntries);
        } else {
            res.status(200).json({});
        }
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
