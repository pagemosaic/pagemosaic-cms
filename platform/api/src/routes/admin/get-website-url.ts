import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {PlatformWebsiteUrl} from 'infra-common/system/Domain';
import {getPlatformWebsiteUrlParams} from 'infra-common/aws/sysParameters';
import {getDistributionDomainAlias} from 'infra-common/aws/cdn';

const router = Router();

router.get('/get-website-url', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        const result: PlatformWebsiteUrl = await getPlatformWebsiteUrlParams();
        result.entryPointDomainAlias = await getDistributionDomainAlias(result.entryPointDistributionId);
        res.status(200).json(result);
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
