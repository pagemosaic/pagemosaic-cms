import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';
import {getSslCertificateArn, setSslCertificateArn, setDomainName} from 'infra-common/aws/sysParameters';
import {requestSSLCertificate} from 'infra-common/aws/sslCertificate';

const router = Router();

router.post('/post-custom-domain-certificate', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    if (!req.body.customDomainName) {
        res.status(500).send('Missing the custom domain name in the request');
        return;
    }
    try {
        const foundCertificateArn = await getSslCertificateArn();
        if (foundCertificateArn) {
            res.status(500).send('To maintain an optimal setup, please remove the existing custom domain name, as there is already an SSL certificate issued for it.');
            return;
        }
        const customDomainName = req.body.customDomainName;
        const certificateArn = await requestSSLCertificate(customDomainName);
        await setSslCertificateArn(certificateArn);
        await setDomainName(customDomainName);
        res.status(200).send({});
    } catch (err: any) {
        console.error(err);
        res.status(500).send(`Requesting a new custom domain SSL certificate is failed. ${err.message}`);
    }
});

export default router;
