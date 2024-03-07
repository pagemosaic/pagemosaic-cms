import {Router, Request, Response} from 'express';
import {DI_Generator, DI_GeneratorStatusSlice} from 'infra-common/data/DocumentItem';
import {getGenerator} from 'infra-common/dao/documentDao';
import {createOrUpdateItem} from 'infra-common/aws/database';
import {
    PLATFORM_DOCUMENTS_TABLE_NAME,
    GENERATOR_IDLE_STATUS,
    GENERATOR_RUNNING_STATUS, GENERATOR_WITH_ERRORS_STATUS
} from 'infra-common/constants';
import {getPublicBucketParams} from 'infra-common/aws/sysParameters';
import {FileObject} from 'infra-common/system/Bucket';
import {getFilesInDirectory} from 'infra-common/aws/bucket';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-generation-start', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    let generatorEntry: DI_Generator | undefined = undefined;
    try {
        generatorEntry = await getGenerator();
    } catch (e: any) {
        console.error(e);
        res.status(500).send(`The generation is failed. ${e.message}`);
        return;
    }
    if (generatorEntry.Status) {
        if (generatorEntry.Status.State.S !== GENERATOR_RUNNING_STATUS) {
            try {
                generatorEntry.Status.State.S = GENERATOR_RUNNING_STATUS;
                const bucketParams = await getPublicBucketParams();
                const allFiles: Array<FileObject> = await getFilesInDirectory(bucketParams, '');
                await createOrUpdateItem<DI_GeneratorStatusSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, generatorEntry.Status);
                res.status(200).send(allFiles);
                return;
            } catch (e: any) {
                try {
                    generatorEntry.Status.State.S = GENERATOR_WITH_ERRORS_STATUS;
                    generatorEntry.Status.Error.S = `The generation is failed. ${e.message}`;
                    await createOrUpdateItem<DI_GeneratorStatusSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, generatorEntry.Status);
                } catch (e: any) {
                    console.log(`Can not write the generator item to DB. ${e.message}`);
                }
                res.status(500).send(`The generation is failed. ${e.message}`);
                return;
            }
        } else {
            res.status(500).send('The generator is running now');
            return;
        }
    }
    res.status(500).send('Missing generator entry.');
});

export default router;
