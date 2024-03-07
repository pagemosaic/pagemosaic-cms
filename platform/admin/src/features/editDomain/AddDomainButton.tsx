import React from 'react';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {ActionDataFieldError} from '@/components/utils/ActionDataFieldError';
import {LucideGlobe} from 'lucide-react';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {useActionForm} from '@/components/utils/ActionFormProvider';

interface AddDomainFormProps {
    isInAction?: boolean;
    actionData: any;
}

function AddDomainForm(props: AddDomainFormProps) {
    const {isInAction, actionData} = props;
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="customDomainName">Domain Name</Label>
                <Input
                    name="customDomainName"
                    type="text"
                    disabled={isInAction}
                    defaultValue=""
                />
                <ActionDataFieldError actionData={actionData} fieldName="customDomainName"/>
                <p className="text-sm text-muted-foreground max-w-[70ch]">
                    You can specify only second-level or third-level domain names.
                </p>
                <p className="text-sm text-muted-foreground max-w-[70ch]">
                    For example, use <strong>promo.domain.com</strong> or <strong>domain.com</strong>.
                </p>
                <p className="text-sm text-muted-foreground max-w-[70ch]">
                    You can specify a wildcard in the domain name, allowing you to use subdomains along with primary domain, such as <code>www.domain.com</code> and <code>domain.com</code>.
                </p>
                <p className="text-sm text-muted-foreground max-w-[70ch]">
                    For instance, use <strong>*.domain.com</strong>.
                </p>
            </div>
        </div>
    );
}

interface AddDomainButtonProps {
    isLoading?: boolean;
}

export function AddDomainButton({isLoading = false}: AddDomainButtonProps) {
    const {showDialog} = useActionForm();
    return (
        <ButtonAction
            Icon={LucideGlobe}
            label="Set Custom Domain"
            variant="default"
            size="sm"
            isLoading={isLoading}
            onClick={() => {
                showDialog({
                    title: 'Set Custom Domain',
                    description: 'Remember to purchase a domain name from a domain service provider. Also, ensure you have access to the DNS record management panel.',
                    buttonLabel: 'Submit',
                    action: 'addDomain',
                    formDataParams: {},
                    render: ({actionData, isInAction}) => {
                        return (
                            <AddDomainForm actionData={actionData} isInAction={isInAction}/>
                        );
                    }
                });
            }}
        />
    );
}