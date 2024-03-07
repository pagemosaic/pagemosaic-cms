import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {getPlatformWebsiteUrlParams} from 'infra-common/aws/sysParameters';
import {PlatformWebsiteUrl, PlatformWebsiteSslCertificateDetails} from 'infra-common/system/Domain';
import {getCertificateDetail} from 'infra-common/aws/sslCertificate';

const router = Router();

router.get('/get-website-ssl-certificate-details', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        const result: PlatformWebsiteUrl = await getPlatformWebsiteUrlParams();
        if (result.sslCertificateArn) {
            const sslCertificate: PlatformWebsiteSslCertificateDetails | undefined = await getCertificateDetail(result.sslCertificateArn);
            if (sslCertificate) {
                res.status(200).json(sslCertificate);
                return;
            }
        }
        res.status(200).json({});
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
