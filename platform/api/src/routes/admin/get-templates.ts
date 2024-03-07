import {Router, Request, Response} from 'express';
import {DI_EntrySlice} from 'infra-common/data/DocumentItem';
import {
    getEntrySliceByEntryType,
    getTemplateEntriesByKeys
} from 'infra-common/dao/documentDao';
import {DI_TEMPLATE_ENTRY_TYPE, PLATFORM_SYSTEM_BUCKET_NAME, BUCKET_DOCUMENTS_DIR} from 'infra-common/constants';
import {getIdFromPK} from 'infra-common/utility/database';
import {getFileContentAsString} from 'infra-common/aws/bucket';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-templates', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        let foundEntries: Array<DI_EntrySlice> = await getEntrySliceByEntryType({S: DI_TEMPLATE_ENTRY_TYPE});
        if (foundEntries.length > 0) {
            const templateEntries = await getTemplateEntriesByKeys(
                foundEntries.map(i => i.PK),
                ['ENTRY', 'TEMPLATE_META', 'TEMPLATE_CONTENT']
            );

            // for (const templateEntry of templateEntries) {
            //     let templateId = getIdFromPK(templateEntry.Entry?.PK.S);
            //     templateEntry.Html = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${templateId}/templateHtml.html`);
            //     templateEntry.Styles = await getFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${templateId}/templateStyles.css`);
            // }

            res.status(200).json(templateEntries);
        } else {
            res.status(200).json({});
        }
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
