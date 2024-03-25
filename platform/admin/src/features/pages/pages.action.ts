import * as z from 'zod';
import {LoaderFunctionArgs, json, redirect} from 'react-router-dom';
import {pagesDataSingleton} from '@/data/PagesData';
import {generatorDataSingleton} from '@/data/GeneratorData';
import {setSessionState} from '@/utils/localStorage';

const createFormSchema = (inSubDirectory: string, withNewTemplate: string) => {
    let zodObject = {
        templateId: z.string().min(1, {
            message: 'The template is not selected'
        }),
    };
    if (inSubDirectory === 'true') {
        zodObject = {
            ...zodObject, ...{
                subDirectory: z.string()
                    .min(1, {
                        message: 'The sub route name should not be empty'
                    })
                    .regex(/^[a-zA-Z0-9\-._~]+$/, {
                        message: 'The sub route name contains invalid characters'
                    }),
            }
        };
    }
    if (withNewTemplate === 'true') {
        zodObject = {
            ...zodObject, ...{
                newTemplateTitle: z.string()
                    .min(1, {
                        message: 'The new template name should not be empty'
                    })
            }
        };
    }
    return z.object(zodObject);
}

const copyFormSchema = (inSubDirectory: string) => {
    let zodObject = {};
    if (inSubDirectory === 'true') {
        zodObject = {
            subDirectory: z.string()
                .min(1, {
                    message: 'The sub route name should not be empty'
                })
                .regex(/^[a-zA-Z0-9\-._~]+$/, {
                    message: 'The sub route name contains invalid characters'
                }),
        };
    }
    return z.object(zodObject);
}

const templateTitleSchema = z.object({
    newTitle: z.string().min(2, {
        message: "The template name must be at least 2 characters.",
    }),
});

export async function pagesAction({request}: LoaderFunctionArgs) {
    switch (request.method) {
        case "POST": {
            try {
                let formData = await request.formData();
                const action = formData.get('action');
                if (action === 'makeCopy') {
                    const data = Object.fromEntries(formData);
                    const formValidationResult = copyFormSchema(data['inSubDirectory'] as string).safeParse(data);
                    if (!formValidationResult.success) {
                        const formatted = formValidationResult.error.format();
                        return json(formatted);
                    }
                    const currentPath = formData.get('currentPath') as string;
                    const subDirectory = formData.get('subDirectory') as string;
                    let pageRoute: string | undefined = currentPath;
                    if (subDirectory) {
                        pageRoute = `${currentPath}/${subDirectory}`;
                    }
                    const pageId = formData.get('pageId') as string;
                    const templateId = formData.get('templateId') as string;
                    if (pageId && templateId) {
                        const newPageId = await pagesDataSingleton.copyPage(pageId, templateId, pageRoute);
                        setSessionState('selectedTab', 'meta'); // force user to open the meta data tab in the page editor screen
                        return redirect(`/edit-page/${newPageId}`);
                    }
                } else if (action === 'createPage') {
                    const data = Object.fromEntries(formData);
                    const formValidationResult = createFormSchema(data['inSubDirectory'] as string, data['withNewTemplate'] as string).safeParse(data);
                    if (!formValidationResult.success) {
                        const formatted = formValidationResult.error.format();
                        return json(formatted);
                    }
                    const currentPath = formData.get('currentPath') as string;
                    const subDirectory = formData.get('subDirectory') as string;
                    let pageRoute: string | undefined = currentPath;
                    if (subDirectory) {
                        pageRoute = `${currentPath}/${subDirectory}`;
                    }
                    const newPageId = await pagesDataSingleton.createPage(
                        data['templateId'] as string,
                        pageRoute,
                        data['newTemplateTitle']?.toString()
                    );
                    setSessionState('selectedTab', 'pageData'); // force user to open the meta data tab in the page editor screen
                    return redirect(`/edit-page/${newPageId}`);
                } else if (action === 'deletePage') {
                    const pageId = formData.get('pageId') as string;
                    const templateId = formData.get('templateId') as string;
                    if (pageId) {
                        await pagesDataSingleton.deletePage(pageId, templateId);
                        return json({ok: true});
                    }
                } else if (action === 'saveChanges') {
                    await pagesDataSingleton.saveChanges();
                    return json({ok: true});
                } else if (action === 'revertChanges') {
                    pagesDataSingleton.revertChanges();
                    return json({ok: true});
                } else if (action === 'publishPages') {
                    const websiteDomain = formData.get('websiteDomain') as string;
                    await generatorDataSingleton.publishChanges(websiteDomain);
                    return json({ok: true});
                } else if (action === 'updateTemplateTitle') {
                    const data = Object.fromEntries(formData);
                    const formValidationResult = templateTitleSchema.safeParse(data);
                    if (!formValidationResult.success) {
                        const formatted = formValidationResult.error.format();
                        return json(formatted);
                    }
                    const templateId = formData.get('templateId') as string;
                    const newTitle = formData.get('newTitle') as string;
                    await pagesDataSingleton.updateTemplateTitle(templateId, newTitle);
                    return json({ok: true});
                }
                return json({});
            } catch (e: any) {
                return json({error: e.message});
            }
        }
        default: {
            throw new Response("", {status: 405});
        }
    }
}
