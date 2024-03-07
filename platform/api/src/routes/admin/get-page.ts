import {Router, Request, Response} from 'express';
import {DI_PageEntry} from 'infra-common/data/DocumentItem';
import {getPageEntriesByKeys} from 'infra-common/dao/documentDao';
import {DI_PAGE_ENTRY_PREFIX, DI_DELETED_PAGE_ENTRY_TYPE} from 'infra-common/constants';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-page', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    const pageId = req.query.pageId as string;
    try {
        const foundEntries: Array<DI_PageEntry> = await getPageEntriesByKeys([{S: `${DI_PAGE_ENTRY_PREFIX}#${pageId}`}],
                ['ENTRY', 'PAGE_META']
            );
        if (foundEntries.length > 0) {
            if (foundEntries[0].Entry?.EntryType.S !== DI_DELETED_PAGE_ENTRY_TYPE){
                res.status(200).json(foundEntries[0]);
            } else {
                // this page is in delete queue
                res.status(200).json({});
            }
        } else {
            res.status(200).json({});
        }
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
