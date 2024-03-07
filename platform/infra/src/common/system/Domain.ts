export type PlatformWebsiteUrlParams = {
    previewPointDomain: string;
    entryPointDomain: string;
    entryPointDistributionId: string;
    sslCertificateArn?: string;
    domain?: string;
};

export type PlatformWebsiteUrl = PlatformWebsiteUrlParams & {
    entryPointDomainAlias?: string;
};

export type SslCertificateStatus = 'EXPIRED'
    | 'FAILED'
    | 'INACTIVE'
    | 'ISSUED'
    | 'PENDING_VALIDATION'
    | 'REVOKED'
    | 'VALIDATION_TIMED_OUT';

export type PlatformWebsiteSslCertificateDetails = {
    customDomainName?: string;
    sslCertificateStatus?: SslCertificateStatus;
    validationCName?: string;
    validationCValue?: string;
}

export type ValidDomain = {
    rootName: string;
    alternativeName?: string;
};
