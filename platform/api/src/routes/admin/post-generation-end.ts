import {Router, Request, Response} from 'express';
import {DI_Generator, DI_GeneratorStatusSlice} from 'infra-common/data/DocumentItem';
import {getGenerator} from 'infra-common/dao/documentDao';
import {createOrUpdateItem} from 'infra-common/aws/database';
import {
    PLATFORM_DOCUMENTS_TABLE_NAME,
    PLATFORM_PUBLIC_BUCKET_NAME,
    GENERATOR_RUNNING_STATUS,
    GENERATOR_IDLE_STATUS,
    GENERATOR_WITH_ERRORS_STATUS
} from 'infra-common/constants';
import {deleteFiles} from 'infra-common/aws/bucket';
import {getPlatformWebsiteUrlParams} from 'infra-common/aws/sysParameters';
import {invalidatePaths} from 'infra-common/aws/cdn';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.post('/post-generation-end', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.deletePaths) {
        res.status(500).send('Missing the delete paths in the request');
        return;
    }
    if (!req.body.invalidatePaths) {
        res.status(500).send('Missing the invalidate paths in the request');
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
        try {
            if (generatorEntry.Status.State.S === GENERATOR_RUNNING_STATUS) {
                const {deletePaths, invalidatePaths: newPaths} = req.body;
                const {entryPointDistributionId} = await getPlatformWebsiteUrlParams();
                let totalInvalidatePaths: Array<string> = newPaths;
                if (deletePaths && deletePaths.length > 0) {
                    await deleteFiles(PLATFORM_PUBLIC_BUCKET_NAME, deletePaths);
                    totalInvalidatePaths = [...totalInvalidatePaths, ...deletePaths];
                }
                if (totalInvalidatePaths) {
                    await invalidatePaths(entryPointDistributionId, totalInvalidatePaths);
                }
            } else {
                throw Error('The generator is not running');
            }
            generatorEntry.Status.State.S = GENERATOR_IDLE_STATUS;
            generatorEntry.Status.LastRun.N = Date.now().toString();
        } catch (err: any) {
            console.error(err);
            generatorEntry.Status.State.S = GENERATOR_WITH_ERRORS_STATUS;
            generatorEntry.Status.Error.S = `The generation is failed. ${err.message}`;
        }
        try {
            await createOrUpdateItem<DI_GeneratorStatusSlice>(PLATFORM_DOCUMENTS_TABLE_NAME, generatorEntry.Status);
        } catch (e: any) {
            console.error(`Can not write the generator item to DB. ${e.message}`);
        }
        res.status(200).send({});
        return;
    }
    res.status(500).send('Missing generator entry.');
});

export default router;
