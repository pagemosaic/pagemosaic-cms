import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Duration } from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

export interface CacheInvalidationProps {
    distribution: cloudfront.Distribution;
    paths: string[];
}

export class CacheInvalidationConstruct extends Construct {
    constructor(scope: Construct, id: string, props: CacheInvalidationProps) {
        super(scope, id);

        new AwsCustomResource(this, 'CacheInvalidationResource', {
            onUpdate: {
                service: 'CloudFront',
                action: 'createInvalidation',
                parameters: {
                    DistributionId: props.distribution.distributionId,
                    InvalidationBatch: {
                        CallerReference: `invalidate-${Date.now()}`,
                        Paths: {
                            Quantity: props.paths.length,
                            Items: props.paths,
                        },
                    },
                },
                physicalResourceId: PhysicalResourceId.of(`invalidate-${Date.now()}`),
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({
                resources: AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
            timeout: Duration.minutes(2),
        });
    }
}
