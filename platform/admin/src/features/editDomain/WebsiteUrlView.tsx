import React from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {ScrollArea} from '@/components/ui/scroll-area';
import {WebsiteUrlData, useWebsiteSslCertificateDetailsData} from '@/data/WebsiteUrlData';
import {Separator} from '@/components/ui/separator';
import {
    LucideRefreshCw,
    LucideExternalLink
} from 'lucide-react';
import {CopyToClipboardButton} from '@/components/utils/CopyToClipboardButton';
import {Skeleton} from '@/components/ui/skeleton';
import {ButtonAction} from '@/components/utils/ButtonAction';
import {SslCertificateStatus} from 'infra-common/system/Domain';
import {getSubdomainRecordName} from 'infra-common/aws/domain';
import {AddDomainButton} from '@/features/editDomain/AddDomainButton';
import {LinkDomainButton} from '@/features/editDomain/LinkDomainButton';
import {Badge} from '@/components/ui/badge';
import {DeleteDomainButton} from '@/features/editDomain/DeleteDomainButton';

interface WebsiteUrlViewProps {
    websiteUrlData?: WebsiteUrlData;
    isLoadingData?: boolean;
}

type CertificateStatusRecord = Record<SslCertificateStatus | 'UNKNOWN', string>;

const sslCertificateStatusLabels: CertificateStatusRecord = {
    EXPIRED: 'Certificate\'s validity period has ended.',
    FAILED: 'Certificate issuance process unsuccessful.',
    INACTIVE: 'Certificate exists but not in use.',
    ISSUED: 'Certificate active and operational.',
    PENDING_VALIDATION: 'Awaiting confirmation of domain ownership.',
    REVOKED: 'Certificate cancelled before its expiration.',
    VALIDATION_TIMED_OUT: 'Ownership confirmation process took too long.',
    UNKNOWN: 'The validation status is unknown'
};


function StatusBadge({status}: { status: SslCertificateStatus;}) {
    if (status === 'EXPIRED' || status === 'FAILED') {
        return (<Badge variant="destructive" className="whitespace-nowrap bg-red-600 text-white">{sslCertificateStatusLabels[status]}</Badge>);
    } else if (status === 'ISSUED') {
        return (<Badge variant="default" className="whitespace-nowrap bg-green-700 text-white">{sslCertificateStatusLabels[status]}</Badge>);
    } else if (status === 'PENDING_VALIDATION' || status === 'INACTIVE') {
        return (<Badge variant="default" className="whitespace-nowrap">{sslCertificateStatusLabels[status]}</Badge>);
    } else {
        return (<Badge variant="default" className="whitespace-nowrap bg-amber-600 text-white">{sslCertificateStatusLabels['UNKNOWN']}</Badge>);
    }
}

export function WebsiteUrlView(props: WebsiteUrlViewProps) {
    const {websiteUrlData, isLoadingData = false} = props;
    const {
        websiteSslCertificateDetailsData,
        websiteSslCertificateDetailsError,
        websiteSslCertificateDetailsStatus,
        websiteSslCertificateDetailsRefresh
    } = useWebsiteSslCertificateDetailsData({
        skip: isLoadingData,
        interval: 10 * 60000
    });

    const publicUrl = websiteUrlData?.entryPointDomainAlias
        ? `https://${websiteUrlData?.entryPointDomainAlias || ''}`
        : `https://${websiteUrlData?.entryPointDomain || ''}`;
    const defaultUrl = `https://${websiteUrlData?.entryPointDomain || ''}`;

    return (
        <div className="flex flex-col gap-2 w-full h-full p-4">
            <div className="flex flex-col gap-2 mb-4">
                <p className="text-xl">Website Address Settings</p>
                <p className="text-sm text-muted-foreground">
                    Here you can set your own domain
                </p>
            </div>
            <div className="relative grow overflow-hidden">
                <Card className="absolute top-0 right-0 left-0 bottom-0 overflow-hidden pt-6">
                    <ScrollArea className="w-full h-full">
                        <CardContent>
                            <div className="flex flex-col gap-8">
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="flex flex-col gap-4">
                                        <Label htmlFor="entryPointDomain">Website Address (URL):</Label>
                                        {isLoadingData
                                            ? (
                                                <div>
                                                    <Skeleton className="h-[1.25em] w-full"/>
                                                </div>
                                            )
                                            : (
                                                <>
                                                    <a
                                                        className="flex flex-row gap-2 items-center text-sm font-semibold hover:underline"
                                                        href={publicUrl}
                                                        target="_blank"
                                                    >
                                                        {publicUrl}<LucideExternalLink className="w-4 h-4"/>
                                                    </a>
                                                    {!websiteUrlData?.entryPointDomainAlias && websiteSslCertificateDetailsData?.sslCertificateStatus === 'ISSUED' && websiteSslCertificateDetailsData?.customDomainName && (
                                                        <div>
                                                            <LinkDomainButton isLoading={isLoadingData}
                                                                              websiteUrlData={websiteUrlData}/>
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        }
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <Label htmlFor="previewPointDomain">Default Website Address (URL):</Label>
                                        {isLoadingData
                                            ? (
                                                <div><Skeleton className="h-[1.25em] w-full"/></div>
                                            )
                                            : (
                                                <a
                                                    className="flex flex-row gap-2 items-center text-sm font-semibold hover:underline"
                                                    href={defaultUrl}
                                                    target="_blank"
                                                >
                                                    <span>{defaultUrl}</span><LucideExternalLink
                                                    className="w-4 h-4"/>
                                                </a>
                                            )
                                        }
                                    </div>
                                </div>
                                <div>
                                    <Separator/>
                                </div>
                                {websiteSslCertificateDetailsError && (
                                    <div>
                                        <p className="text-xs text-red-600 font-semibold">{websiteSslCertificateDetailsError}</p>
                                    </div>
                                )}
                                {!isLoadingData && (
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="flex flex-col gap-4">
                                            <Label htmlFor="customDomainName">Custom Domain:</Label>
                                            {websiteSslCertificateDetailsStatus === 'loading' && (
                                                <Skeleton className="h-[1.25em] w-full"/>
                                            )}
                                            {websiteSslCertificateDetailsStatus !== 'loading' && (
                                                <p className="text-sm font-semibold">
                                                    {websiteUrlData?.domain
                                                        ? websiteUrlData?.domain
                                                        : (
                                                            <span className="text-muted-foreground">
                                                                No custom domain set up
                                                            </span>
                                                        )
                                                    }
                                                </p>
                                            )}
                                            {websiteSslCertificateDetailsStatus !== 'loading' && (
                                                <div>
                                                    {websiteSslCertificateDetailsData?.customDomainName
                                                        ? (
                                                            <DeleteDomainButton websiteUrlData={websiteUrlData}/>
                                                        )
                                                        : (
                                                            <AddDomainButton/>
                                                        )
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {websiteUrlData?.sslCertificateArn && (
                                                <div className="flex flex-col gap-4">
                                                    <Label htmlFor="customDomainName">Domain Validation Status:</Label>
                                                    {websiteSslCertificateDetailsStatus === 'loading'
                                                        ? (
                                                            <Skeleton className="h-[1.25em] w-full"/>
                                                        )
                                                        : (
                                                            <div>
                                                                <StatusBadge
                                                                    status={websiteSslCertificateDetailsData?.sslCertificateStatus as SslCertificateStatus}/>
                                                            </div>
                                                        )
                                                    }
                                                    <div>
                                                        <ButtonAction
                                                            size="sm"
                                                            variant="outline"
                                                            isLoading={websiteSslCertificateDetailsStatus === 'loading'}
                                                            Icon={LucideRefreshCw}
                                                            label="Refresh"
                                                            onClick={websiteSslCertificateDetailsRefresh}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {websiteSslCertificateDetailsData?.validationCName && websiteSslCertificateDetailsData?.validationCValue && (
                                    <>
                                        <div>
                                            <Separator/>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-sm max-w-[77ch]">
                                                For successful domain validation, please add the specified records to
                                                your DNS configuration, accessible through your domain name's DNS
                                                service provider.
                                            </p>
                                            <p className="text-sm font-semibold max-w-[77ch]">
                                                Domain ownership validation may require up to 48 hours, subject to the
                                                domain's DNS availability.
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
                                                            text={websiteSslCertificateDetailsData?.validationCName || ''}
                                                            size="xs"
                                                            variant="ghost"
                                                            className="absolute top-0 right-2 z-10"
                                                        />
                                                        <div className="prose-fixed">
                                                                <pre className="relative">
                                                                    <code>
                                                                        {websiteSslCertificateDetailsData?.validationCName}
                                                                    </code>
                                                                </pre>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 pb-2 pt-6 align-middle relative">
                                                        <CopyToClipboardButton
                                                            variant="ghost"
                                                            text={websiteSslCertificateDetailsData?.validationCValue || ''}
                                                            size="xs"
                                                            className="absolute top-0 right-2 z-10"
                                                        />
                                                        <div className="prose-fixed w-full overflow-x-auto">
                                                                <pre className="pr-8">
                                                                    <code>
                                                                        {websiteSslCertificateDetailsData?.validationCValue}
                                                                    </code>
                                                                </pre>
                                                        </div>
                                                    </td>
                                                </tr>
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
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}