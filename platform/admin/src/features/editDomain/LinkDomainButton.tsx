import React from 'react';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {LucideLink} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {useActionForm} from '@/components/utils/ActionFormProvider';
import {CopyToClipboardButton} from '@/components/utils/CopyToClipboardButton';
import {getSubdomainRecordName} from 'infra-common/aws/domain';
import {WebsiteUrlData} from '@/data/WebsiteUrlData';

interface LinkDomainFormProps {
    actionData: any;
    websiteUrlData?: WebsiteUrlData;
}

function LinkDomainForm(props: LinkDomainFormProps) {
    const {actionData, websiteUrlData} = props;
    return (
        <div className="flex flex-col gap-4">
            <ActionDataFieldError actionData={actionData} fieldName="domain"/>
            <div>
                <p className="text-sm">
                    Ensure to add the following DNS record via your domain name
                    provider before initiating the domain linking process.
                </p>
            </div>
            <div>
                <table className="w-full border-0 table-fixed">
                    <thead>
                    <tr>
                        <th className="p-2 min-w-[100px] w-[10%]">
                            <p className="text-sm font-semibold text-muted-foreground">Type</p>
                        </th>
                        <th className="p-2 w-[30%]">
                            <p className="text-sm font-semibold text-muted-foreground">Name</p>
                        </th>
                        <th className="p-2">
                            <p className="text-sm font-semibold text-muted-foreground">Value</p>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td className="px-2 pb-2 pt-6 align-middle">
                            <div className="rounded-[4px]">
                                <p className="text-sm font-normal text-muted-foreground">
                                    CNAME or ALIAS
                                </p>
                            </div>
                        </td>
                        <td className="px-2 pb-2 pt-6 align-middle relative">
                            <CopyToClipboardButton
                                text={getSubdomainRecordName(websiteUrlData?.domain)}
                                size="xs"
                                variant="ghost"
                                className="absolute top-0 right-2 z-10"
                            />
                            <div className="prose-fixed">
                                <pre className="relative">
                                    <code>
                                        {getSubdomainRecordName(websiteUrlData?.domain)}
                                    </code>
                                </pre>
                            </div>
                        </td>
                        <td className="px-2 pb-2 pt-6 align-middle relative">
                            <CopyToClipboardButton
                                variant="ghost"
                                text={websiteUrlData?.entryPointDomain || ''}
                                size="xs"
                                className="absolute top-0 right-2 z-10"
                            />
                            <div className="prose-fixed w-full overflow-x-auto">
                                <pre className="pr-8">
                                    <code>
                                        {websiteUrlData?.entryPointDomain}
                                    </code>
                                </pre>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

interface LinkDomainButtonProps {
    isLoading?: boolean;
    websiteUrlData?: WebsiteUrlData;
}

export function LinkDomainButton({isLoading = false, websiteUrlData}: LinkDomainButtonProps) {
    const {showDialog} = useActionForm();
    return (
        <ButtonAction
            Icon={LucideLink}
            label="Link Custom Domain to Website"
            variant="default"
            size="sm"
            isLoading={isLoading}
            onClick={() => {
                showDialog({
                    title: 'Link Custom Domain to Website',
                    buttonLabel: 'Link',
                    action: 'linkDomain',
                    contentClassName: 'max-w-[700px]',
                    formDataParams: {
                        domain: websiteUrlData?.domain || ''
                    },
                    render: ({actionData, isInAction}) => {
                        return (
                            <LinkDomainForm actionData={actionData} websiteUrlData={websiteUrlData}/>
                        );
                    }
                });
            }}
        />
    );
}