import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {getPlatformWebsiteUrlParams} from 'infra-common/aws/sysParameters';
import {PlatformWebsiteSslCertificateDetails} from 'infra-common/system/Domain';
import {getCertificateDetail} from 'infra-common/aws/sslCertificate';
import {getDistributionDomainAlias, setCloudFrontDomain} from 'infra-common/aws/cdn';

const router = Router();

router.post('/post-custom-domain-distribution', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        const {domain, sslCertificateArn, entryPointDistributionId} = await getPlatformWebsiteUrlParams();

        if (!sslCertificateArn) {
            res.status(500).send('It seems that you do not have SSL certificate issued. Please add the custom domain name.');
            return;
        }
        if (!entryPointDistributionId) {
            res.status(500).send('Missing distribution ID. Try to redeploy the platform.');
            return;
        }
        if (!domain) {
            res.status(500).send('Missing domain name. Please add a custom domain name.');
            return;
        }

        const sslCertificate: PlatformWebsiteSslCertificateDetails | undefined = await getCertificateDetail(sslCertificateArn);
        if (!sslCertificate) {
            res.status(500).send('System error. There are problems with getting details of the SSL certificate');
            return;
        }
        const existingDomainAlias = await getDistributionDomainAlias(entryPointDistributionId);
        if (existingDomainAlias) {
            res.status(500).send('The custom domain is already linked. To proceed, please delete the current custom domain name.');
            return;
        }
        await setCloudFrontDomain(entryPointDistributionId, sslCertificateArn, domain);
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Setting a new custom domain to distribution is failed. ${err.message}`);
    }
});

export default router;
