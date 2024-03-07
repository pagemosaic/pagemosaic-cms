import * as z from 'zod';
import {LoaderFunctionArgs, json} from 'react-router-dom';
import {websiteDataSingleton} from '@/data/WebsiteUrlData';

const addDomainFormSchema = z.object({
    customDomainName: z.string().min(2, {
        message: "Custom domain name must be at least 2 characters.",
    }),
});

const linkDomainFormSchema = z.object({
    domain: z.string().min(2, {
        message: "Missing domain name",
    }),
});

const deleteDomainFormSchema = z.object({
    sslCertificateArn: z.string().min(2, {
        message: "Missing the SSL certificate ARN",
    }),
    entryPointDomain: z.string().min(2, {
        message: "Missing the default domain name",
    }),
    entryPointDomainAlias: z.string().min(2, {
        message: "Missing the domain name",
    }),
});

export async function editDomainAction({request}: LoaderFunctionArgs) {
    switch (request.method) {
        case "POST": {
            let formData = await request.formData();
            const action = formData.get('action');
            if (action === 'addDomain') {
                const data = Object.fromEntries(formData);
                const validationResult = addDomainFormSchema.safeParse(data);
                if (!validationResult.success) {
                    const formatted = validationResult.error.format();
                    return json(formatted);
                }
                try {
                    await websiteDataSingleton.setCustomDomainCertificate(data['customDomainName'] as string);
                    // If you have just created a certificate using the RequestCertificate action,
                    // there is a delay of several seconds before you can retrieve information about it.
                    await new Promise((res) => setTimeout(res, 5000));
                } catch (e: any) {
                    return json({error: e.message});
                }
                return json({ok: true});
            } else if (action === 'linkDomain') {
                const data = Object.fromEntries(formData);
                const validationResult = linkDomainFormSchema.safeParse(data);
                if (!validationResult.success) {
                    const formatted = validationResult.error.format();
                    return json(formatted);
                }
                try {
                    await websiteDataSingleton.setCustomDomainDistribution();
                } catch (e: any) {
                    return json({error: e.message});
                }
                return json({ok: true});
            } else if (action === 'deleteDomain') {
                const data = Object.fromEntries(formData);
                const validationResult = deleteDomainFormSchema.safeParse(data);
                if (!validationResult.success) {
                    const formatted = validationResult.error.format();
                    return json(formatted);
                }
                try {
                    await websiteDataSingleton.deleteCustomDomain();
                    await new Promise((res) => setTimeout(res, 1000));
                    const customDomain = data['entryPointDomainAlias'] as string;
                    const defaultDomain = data['entryPointDomain'] as string;
                    if (request.url.includes(customDomain)){
                        window.location.href = `https://${defaultDomain}/admin/edit-domain`;
                    }
                } catch (e: any) {
                    return json({error: e.message});
                }
                return json({ok: true});
            }
            break;
        }
        default: {
            throw new Response("", {status: 405});
        }
    }
}
