import React from 'react';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {LucideTrash2} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {WebsiteUrlData} from '@/data/WebsiteUrlData';

interface DeleteDomainFormProps {
    actionData: any;
}

function DeleteDomainForm(props: DeleteDomainFormProps) {
    const {actionData} = props;
    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm">
                Are you sure you want to delete the current domain name?
            </p>
            <ActionDataFieldError actionData={actionData} fieldName="sslCertificateArn"/>
            <ActionDataFieldError actionData={actionData} fieldName="entryPointDomain"/>
            <ActionDataFieldError actionData={actionData} fieldName="entryPointDomainAlias"/>
        </div>
    );
}

interface DeleteDomainButtonProps {
    isLoading?: boolean;
    websiteUrlData?: WebsiteUrlData;
}

export function DeleteDomainButton({isLoading = false, websiteUrlData}: DeleteDomainButtonProps) {
    const {showDialog} = useActionForm();
    return (
        <ButtonAction
            Icon={LucideTrash2}
            label="Delete Domain"
            variant="destructive"
            size="sm"
            isLoading={isLoading}
            onClick={() => {
                showDialog({
                    title: 'Delete Custom Domain',
                    // description: 'Remember to purchase a domain name from a domain service provider. Also, ensure you have access to the DNS record management panel.',
                    buttonLabel: 'Delete',
                    action: 'deleteDomain',
                    formDataParams: {
                        sslCertificateArn: websiteUrlData?.sslCertificateArn || '',
                        entryPointDomain: websiteUrlData?.entryPointDomain || '',
                        entryPointDomainAlias: websiteUrlData?.entryPointDomainAlias || ''
                    },
                    render: ({actionData}) => {
                        return (
                            <DeleteDomainForm actionData={actionData}/>
                        );
                    }
                });
            }}
        />
    );
}