import {
    CloudFrontClient,
    GetDistributionConfigCommand,
    UpdateDistributionCommand,
    CreateInvalidationCommand
} from "@aws-sdk/client-cloudfront";
import {getValidDomain} from './domain';

const REGION = process.env.AWS_REGION;
let cloudFrontClient: CloudFrontClient | undefined = undefined;

function getCloudFrontClient(): CloudFrontClient {
    if (!cloudFrontClient) {
        cloudFrontClient = new CloudFrontClient({region: REGION});
    }
    return cloudFrontClient;
}

export async function setCloudFrontDomain(
    distributionId: string,
    certificateArn: string,
    domainName: string
): Promise<void> {
    const client = getCloudFrontClient();

    const validDomain = getValidDomain(domainName);

    // Get the current distribution configuration
    const getDistributionConfigCommand = new GetDistributionConfigCommand({ Id: distributionId });
    const distributionConfigResponse = await client.send(getDistributionConfigCommand);
    const distributionConfig = distributionConfigResponse.DistributionConfig;

    if (!distributionConfig) {
        throw new Error("Failed to retrieve distribution configuration.");
    }

    // Update the distribution configuration with the new certificate and domain names
    distributionConfig.ViewerCertificate = {
        ACMCertificateArn: certificateArn,
        SSLSupportMethod: "sni-only",
        MinimumProtocolVersion: "TLSv1.2_2021"
    };

    const aliasesItems = validDomain.alternativeName
        ? [validDomain.rootName, validDomain.alternativeName]
        : [validDomain.rootName];

    distributionConfig.Aliases = {
        Quantity: aliasesItems.length,
        Items: aliasesItems
    };

    // Update the distribution
    const updateDistributionCommand = new UpdateDistributionCommand({
        Id: distributionId,
        DistributionConfig: distributionConfig,
        // You must rename the ETag field to IfMatch, leaving the value unchanged.
        // (Set the value of IfMatch to the value of ETag, then remove the ETag field.)
        IfMatch: distributionConfigResponse.ETag
    });

    await client.send(updateDistributionCommand);
}

export async function removeCloudFrontDomain(distributionId: string): Promise<void> {
    const client = getCloudFrontClient();

    // Get the current distribution configuration
    const getDistributionConfigCommand = new GetDistributionConfigCommand({ Id: distributionId });
    const distributionConfigResponse = await client.send(getDistributionConfigCommand);
    const distributionConfig = distributionConfigResponse.DistributionConfig;

    if (!distributionConfig || !distributionConfigResponse.ETag) {
        throw new Error("Failed to retrieve distribution configuration.");
    }

    // Remove the SSL certificate and domain names from the CloudFront distribution
    distributionConfig.ViewerCertificate = {
        CloudFrontDefaultCertificate: true,
        SSLSupportMethod: "sni-only",
        MinimumProtocolVersion: "TLSv1.2_2021"
    };
    distributionConfig.Aliases = { Quantity: 0, Items: [] };

    // Update the distribution
    const updateDistributionCommand = new UpdateDistributionCommand({
        Id: distributionId,
        DistributionConfig: distributionConfig,
        // You must rename the ETag field to IfMatch, leaving the value unchanged.
        // (Set the value of IfMatch to the value of ETag, then remove the ETag field.)
        IfMatch: distributionConfigResponse.ETag
    });

    await client.send(updateDistributionCommand);
}

export async function getDistributionDomainAlias(distributionId: string): Promise<string | undefined> {
    const client = getCloudFrontClient();

    // Get the current distribution configuration
    const getDistributionConfigCommand = new GetDistributionConfigCommand({ Id: distributionId });
    const distributionConfigResponse = await client.send(getDistributionConfigCommand);
    const distributionConfig = distributionConfigResponse.DistributionConfig;

    if (!distributionConfig) {
        throw new Error("Failed to retrieve distribution configuration.");
    }

    const aliases = distributionConfig.Aliases;
    if (aliases && aliases.Items && aliases.Items.length > 0) {
        const aliasParts = aliases?.Items[0]?.split('.');
        if (aliasParts && aliasParts[0] === '*') {
            return aliasParts.slice(1).join('.');
        }
        return aliases.Items[0];
    }
    return undefined;
}

export async function invalidatePaths(distributionId: string, paths: Array<string>): Promise<void> {
    if (paths.length > 0) {
        const client = getCloudFrontClient();
        const Items = paths.filter(p => !!p).map(p => encodeURI(p.startsWith('/') ? p : `/${p}`));
        const createInvalidationCommand = new CreateInvalidationCommand({
            DistributionId: distributionId,
            InvalidationBatch: {
                Paths: {
                    Quantity: paths.length,
                    Items,
                },
                CallerReference: `invalidate-${new Date().getTime()}`, // Unique value for each invalidation
            },
        });
        await client.send(createInvalidationCommand);
    }
}
