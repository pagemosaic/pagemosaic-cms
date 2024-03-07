import {Router, Request, Response} from 'express';
import {verifyAuthentication} from '../../utility/RequestUtils';

const router = Router();

router.get('/get-templates-websites-gallery-index', async (req: Request, res: Response) => {
    try {
        await verifyAuthentication(req);
    } catch (e: any) {
        res.status(401).send(e.message);
        return;
    }
    try {
        const response = await fetch(encodeURI('https://pagemosaic.github.io/templates_gallery_index.json'), {method: 'GET'});
        if (!response.ok) {
            if (response.status === 404) {
                throw Error(`Resource templates_gallery_index.json is not found`);
            }
            const errorData = await response.text();
            throw Error(errorData);
        }
        const result = await response.json();
        res.status(200).send(result);
    } catch (e: any) {
        res.status(500).send(e.message);
    }
});

export default router;
