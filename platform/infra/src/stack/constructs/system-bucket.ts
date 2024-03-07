import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import {PLATFORM_SYSTEM_BUCKET_NAME} from '../../common/constants';

export interface SystemBucketConstructProps {
}

export class SystemBucketConstruct extends Construct {
    public readonly bucket: s3.Bucket;
    public readonly bucketOAI: cloudfront.OriginAccessIdentity;
    constructor(scope: Construct, id: string, props?: SystemBucketConstructProps) {
        super(scope, id);
        this.bucket = new s3.Bucket(this, 'SystemBucket', {
            bucketName: PLATFORM_SYSTEM_BUCKET_NAME,
            publicReadAccess: false,
            removalPolicy: cdk.RemovalPolicy.RETAIN
        });

        // Define the OAI for CloudFront to access the S3 bucket
        this.bucketOAI = new cloudfront.OriginAccessIdentity(this, 'SystemBucketOAI');
        this.bucket.grantRead(this.bucketOAI);
    }
}
