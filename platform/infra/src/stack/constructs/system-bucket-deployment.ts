import { resolve } from "node:path";
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import {CacheInvalidationConstruct} from './cache-invalidation';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

export interface SystemBucketConstructProps {
    systemBucket: s3.Bucket;
    entryPointDistribution: cloudfront.Distribution;
}

export class SystemBucketDeploymentConstruct extends Construct {
    constructor(scope: Construct, id: string, props: SystemBucketConstructProps) {
        super(scope, id);

        new s3deploy.BucketDeployment(this, 'AdminPwaDeployment', {
            sources: [s3deploy.Source.asset(resolve('../admin/dist'))],
            destinationBucket: props.systemBucket,
            destinationKeyPrefix: 'admin', // Deploy contents to /admin directory in the bucket
        });

        new CacheInvalidationConstruct(this, 'EntryPointDistributionInvalidation', {
            distribution: props.entryPointDistribution,
            paths: ['/admin/*'],
        });
    }
}
