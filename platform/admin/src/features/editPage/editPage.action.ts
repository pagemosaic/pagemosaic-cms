import {LoaderFunctionArgs, json} from 'react-router-dom';
import * as z from 'zod';
import {pageDataSingleton} from '@/data/PageData';

const dataSchema = z.object({
    PageTitle: z.string().min(2, {
        message: "The page title must be at least 2 characters.",
    }),
    PageSlug: z.string()
        .regex(/^[a-zA-Z0-9_-]+$/, {
            message: "The page slug must consist only of letters, numbers, underscores, or hyphens"
        })
        .min(2, {
            message: "The page slug must be at least 2 characters.",
        })
});

export async function editPageAction({request}: LoaderFunctionArgs) {
    switch (request.method) {
        case "POST": {
            let formData = await request.formData();
            const action = formData.get('action');
            if (action === 'updatePageMeta') {
                try {
                    const data = Object.fromEntries(formData);
                    const dataValidationResult = dataSchema.safeParse(data);
                    if (!dataValidationResult.success) {
                        const formatted = dataValidationResult.error.format();
                        return json(formatted);
                    }
                    const pageId = data['pageId'].toString();
                    const templateId = data['templateId'].toString();
                    const pageTitle = data['PageTitle'] as string;
                    const pageSlug = data['PageSlug'] as string;
                    const excludeFromSitemap = data['ExcludeFromSitemap'] as string;
                    await pageDataSingleton.savePageMeta(
                        pageId,
                        templateId,
                        pageTitle,
                        pageSlug,
                        excludeFromSitemap
                    );
                    return json({ok: true});
                } catch (e: any) {
                    return json({error: e.message});
                }
            }
            return null;
        }
        default: {
            throw new Response("", {status: 405});
        }
    }
}
