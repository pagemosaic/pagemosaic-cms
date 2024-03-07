import {
    Form,
    LoaderFunctionArgs,
    useActionData,
    json,
    redirect,
    useNavigation,
    Link
} from 'react-router-dom';
import * as z from 'zod';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {post} from '@/utils/ClientApi';
import {sysUserDataSingleton} from '@/data/SysUserData';
import {ActionDataRequestError} from '@/components/utils/ActionDataRequestError';
import {AuthResponse} from 'infra-common/system/Auth';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {LucideLogIn} from 'lucide-react';
import {PLATFORM_STACK_NAME} from 'infra-common/constants';

const loginFormSchema = z.object({
    username: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }),
    password: z.string().min(2, {
        message: "Password must be at least 2 characters.",
    }),
});

export async function loginAction({request}: LoaderFunctionArgs) {
    switch (request.method) {
        case "POST": {
            let formData = await request.formData();
            const data = Object.fromEntries(formData);
            const validationResult = loginFormSchema.safeParse(data);
            if (!validationResult.success) {
                const formatted = validationResult.error.format();
                return json(formatted);
            }
            try {
                const authResponse = await post<AuthResponse>('/api/admin/post-sys-user-auth', data);
                if (authResponse) {
                    if (authResponse.code === 'change_password') {
                        return json({error: 'You have to change password'});
                    } else {
                        await sysUserDataSingleton.setData({
                            userAttributes: authResponse.userAttributes,
                            userToken: authResponse.userToken
                        });
                        return redirect('/');
                    }
                }
                return json({error: 'Missing auth response'});
            } catch (e: any) {
                return json({error: e.message});
            }
        }
        default: {
            throw new Response("", {status: 405});
        }
    }
}

export function LoginRoute() {
    const actionData: any = useActionData();
    let navigation = useNavigation();
    const isLoading = navigation.state === 'loading' || navigation.state === 'submitting'; // !!navigation.formData?.get('username');
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
            <Form method="post">
                <Card className="w-[450px]">
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>Login as administrator to the "{PLATFORM_STACK_NAME}" site</CardDescription>
                        <ActionDataRequestError actionData={actionData}/>
                    </CardHeader>
                    <CardContent>
                        <div className="grid w-full items-center gap-6">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">User Name</Label>
                                <Input autoFocus={true} name="username" disabled={isLoading}/>
                                <ActionDataFieldError actionData={actionData} fieldName="username"/>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">Password</Label>
                                <Input type="password" name="password" disabled={isLoading}/>
                                <ActionDataFieldError actionData={actionData} fieldName="password"/>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" disabled={isLoading} type="button" asChild={true}>
                            <Link to="/password-reset">Forgot</Link>
                        </Button>
                        <ButtonAction type="submit" label="Login" Icon={LucideLogIn} isLoading={isLoading} />
                    </CardFooter>
                </Card>
            </Form>
        </div>
    );
}
