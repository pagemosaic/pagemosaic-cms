import {
    SSMClient,
    GetParameterCommand,
    PutParameterCommand,
    PutParameterCommandInput,
    DeleteParameterCommand
} from "@aws-sdk/client-ssm";
import {
    PARAM_SYS_USER_POOL_ID,
    PARAM_SYS_USER_POOL_CLIENT_ID,
    PARAM_PREVIEW_POINT_DOMAIN,
    PARAM_ENTRY_POINT_DISTRIBUTION_ID,
    PARAM_ENTRY_POINT_DOMAIN,
    PARAM_SSL_CERTIFICATE_ARN,
    PARAM_DOMAIN,
    PLATFORM_PUBLIC_BUCKET_NAME
} from '../constants';
import {
    PlatformWebsiteUrlParams
} from '../system/Domain';
import {BucketParams} from '../system/Bucket';

export type CognitoUserPoolConfig = {
    UserPoolId: string;
    ClientId: string;
};

let ssmClient: undefined | SSMClient = undefined;
let sysUserPoolConfig: undefined | CognitoUserPoolConfig = undefined;

export function getSsmClient(): SSMClient {
    if (!ssmClient) {
        ssmClient = new SSMClient();
    }
    return ssmClient;
}

export async function getSsmParameter(parameterName: string): Promise<string> {
    try {
        const command = new GetParameterCommand({Name: parameterName});
        const response = await getSsmClient().send(command);
        return response.Parameter?.Value || '';
    } catch (e) {
        ////
    }
    return '';
}

export async function putSsmParameter(parameterName: string, parameterValue: string) {
    const params: PutParameterCommandInput = {
        Name: parameterName,
        Type: 'String',
        Value: parameterValue,
        Overwrite: true
    };

    try {
        const command = new PutParameterCommand(params);
        await getSsmClient().send(command);
    } catch (err) {
        console.error(`Error storing parameter ${parameterName}:`, err);
    }
}

export async function delSsmParameter(parameterName: string) {
    const params = {
        Name: parameterName
    };
    try {
        const command = new DeleteParameterCommand(params);
        await getSsmClient().send(command);
    } catch (err) {
        console.error(`Error deleting parameter ${parameterName}:`, err);
    }
}

export async function setSslCertificateArn(certificateArn: string): Promise<void> {
    await putSsmParameter(PARAM_SSL_CERTIFICATE_ARN, certificateArn);
}

export async function delSslCertificateArn(): Promise<void> {
    await delSsmParameter(PARAM_SSL_CERTIFICATE_ARN);
}

export async function setDomainName(domainName: string): Promise<void> {
    await putSsmParameter(PARAM_DOMAIN, domainName);
}

export async function delDomainName(): Promise<void> {
    await delSsmParameter(PARAM_DOMAIN);
}

// s61kc8aqK
export async function getSysUserPoolConfig(): Promise<CognitoUserPoolConfig> {
    if (!sysUserPoolConfig) {
        sysUserPoolConfig = {
            UserPoolId: await getSsmParameter(PARAM_SYS_USER_POOL_ID),
            ClientId: await getSsmParameter(PARAM_SYS_USER_POOL_CLIENT_ID)
        };
    }
    return sysUserPoolConfig;
}

export async function getPreviewPointDomain(): Promise<string> {
    return getSsmParameter(PARAM_PREVIEW_POINT_DOMAIN);
}

export async function getEntryPointDistributionId(): Promise<string> {
    return getSsmParameter(PARAM_ENTRY_POINT_DISTRIBUTION_ID);
}

export async function getSslCertificateArn(): Promise<string> {
    return getSsmParameter(PARAM_SSL_CERTIFICATE_ARN);
}

export async function getPlatformWebsiteUrlParams(): Promise<PlatformWebsiteUrlParams> {
    return {
        entryPointDistributionId: await getSsmParameter(PARAM_ENTRY_POINT_DISTRIBUTION_ID),
        previewPointDomain: await getSsmParameter(PARAM_PREVIEW_POINT_DOMAIN),
        entryPointDomain: await getSsmParameter(PARAM_ENTRY_POINT_DOMAIN),
        sslCertificateArn: await getSsmParameter(PARAM_SSL_CERTIFICATE_ARN),
        domain: await getSsmParameter(PARAM_DOMAIN)
    };
}

export async function getPublicBucketParams(): Promise<BucketParams> {
    return {
        bucketName: PLATFORM_PUBLIC_BUCKET_NAME,
        entryPointDomain: await getSsmParameter(PARAM_ENTRY_POINT_DOMAIN)
    };
}
