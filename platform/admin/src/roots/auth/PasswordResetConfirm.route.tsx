import {Card, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';

export function PasswordResetConfirmRoute() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Recovery Letter Sent</CardTitle>
                    <CardDescription>The recovery letter has been successfully sent to your email. Please check the email box and follow the instructions in the letter.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
