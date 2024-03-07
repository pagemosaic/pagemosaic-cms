import {resolve} from "node:path";
import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {PLATFORM_STACK_NAME} from '../../common/constants';

export interface AdminApiConstructProps {
    systemBucket: s3.Bucket;
    publicBucket: s3.Bucket;
    tables: Array<dynamodb.Table>;
    sysUserPoolId: string;
}

export class ApiConstruct extends Construct {
    public readonly httpApi: apigwv2.HttpApi;
    public readonly httpApiGatewayOrigin: origins.HttpOrigin;

    constructor(scope: Construct, id: string, props: AdminApiConstructProps) {
        super(scope, id);
        const {systemBucket, publicBucket, tables, sysUserPoolId} = props;

        const apiDirectoryPath = resolve('../api/dist');
        const lambdaHandler = new lambda.Function(this, 'ApiLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(apiDirectoryPath),
            memorySize: 256,
            description: `${PLATFORM_STACK_NAME} API Lambda.`,
            timeout: cdk.Duration.minutes(5),
        });

        // Grant the Lambda function permission to read all SSM parameters
        lambdaHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: ['ssm:*'],
            resources: [`arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/*`],
        }));

        lambdaHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: ['cognito-idp:*'], // Grant all actions for Cognito User Pool
            resources: [`arn:aws:cognito-idp:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:userpool/${sysUserPoolId}`],
        }));

        // Add ACM permissions to us-east-1 region certificates
        lambdaHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                'acm:DescribeCertificate',
                'acm:RequestCertificate',
                'acm:DeleteCertificate'
            ],
            resources: [`arn:aws:acm:us-east-1:${cdk.Aws.ACCOUNT_ID}:certificate/*`], // Adjust as needed
        }));

        // Add CloudFront permissions
        lambdaHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                'cloudfront:GetDistributionConfig',
                'cloudfront:UpdateDistribution',
                'cloudfront:CreateInvalidation'
            ],
            resources: [`arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/*`], // Adjust as needed
        }));

        if (tables.length > 0) {
            for (const table of tables) {
                // Grant the Lambda function read access to the DynamoDB table
                table.grantReadWriteData(lambdaHandler);
            }
        }

        // Grant the Lambda function read and write access to the S3 user bucket
        publicBucket.grantRead(lambdaHandler);
        publicBucket.grantWrite(lambdaHandler);
        publicBucket.grantPut(lambdaHandler);
        publicBucket.grantDelete(lambdaHandler);

        // Grant the Lambda function read and write access to the S3 system bucket
        systemBucket.grantRead(lambdaHandler);
        systemBucket.grantWrite(lambdaHandler);
        systemBucket.grantPut(lambdaHandler);
        systemBucket.grantDelete(lambdaHandler);

        // Define the HTTP API resource with the Lambda integration
        const lambdaIntegration = new apigwv2Integrations.HttpLambdaIntegration(
            'ApiLambdaIntegration', lambdaHandler
        );

        this.httpApi = new apigwv2.HttpApi(this, 'Api', {
            defaultIntegration: lambdaIntegration,
            description: `${PLATFORM_STACK_NAME} API Endpoint`
        });

        // Define the HTTP Admin API Gateway endpoint as a custom origin
        const region = cdk.Stack.of(this).region;
        this.httpApiGatewayOrigin = new origins.HttpOrigin(`${this.httpApi.apiId}.execute-api.${region}.amazonaws.com`, {
            // Optionally, configure origin properties like custom headers, SSL protocols, etc.
            // If you have a custom domain name for your CloudFront distribution
            // and you want your application to be aware of this custom domain,
            // you should set the X-Forwarded-Host header to this custom domain name.
            // customHeaders: {
            //     'X-Forwarded-Host': hostValue
            // }
        });
    }
}
