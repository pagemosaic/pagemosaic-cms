import { resolve } from "node:path";
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {PLATFORM_STACK_NAME} from '../../common/constants';

export interface WebConstructProps {
    userBucket: s3.Bucket;
    tables: Array<dynamodb.Table>;
}

export class WebConstruct extends Construct {
    public readonly httpApi: apigwv2.HttpApi;
    public readonly httpApiGatewayOrigin: origins.HttpOrigin;

    constructor(scope: Construct, id: string, props: WebConstructProps) {
        super(scope, id);
        const {tables, userBucket} = props;

        const lambdaHandler = new lambda.Function(this, 'WebLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(resolve('../web/dist')),
            memorySize: 256,
            description: `${PLATFORM_STACK_NAME} Web Lambda.`
        });

        // Grant the Lambda function permission to read all SSM parameters
        lambdaHandler.addToRolePolicy(new iam.PolicyStatement({
            actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
            resources: [`arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/*`],
        }));

        if (tables.length > 0) {
            for (const table of tables) {
                // Grant the Lambda function read access to the DynamoDB table
                table.grantReadWriteData(lambdaHandler);
            }
        }

        // Grant the Lambda function read access to the S3 user bucket
        userBucket.grantRead(lambdaHandler);

        // Define the HTTP API resource with the Lambda integration
        const lambdaIntegration = new apigwv2Integrations.HttpLambdaIntegration(
            'WebLambdaIntegration', lambdaHandler
        );

        this.httpApi = new apigwv2.HttpApi(this, 'WebHttpApi', {
            defaultIntegration: lambdaIntegration
        });

        const region = cdk.Stack.of(this).region;
        // Define the HTTP Web API Gateway endpoint as a custom origin
        const webId = this.httpApi.apiId;
        this.httpApiGatewayOrigin = new origins.HttpOrigin(`${webId}.execute-api.${region}.amazonaws.com`, {
            // Optionally, configure origin properties like custom headers, SSL protocols, etc.
            // If you have a custom domain name for your CloudFront distribution
            // and you want your application to be aware of this custom domain,
            // you should set the X-Forwarded-Host header to this custom domain name.
            // customHeaders: {
            //     'X-Forwarded-Host': hostValue
            // }
        });

        // Output the HTTP API URL to the stack outputs
        // new cdk.CfnOutput(this, 'WebAppApiUrl', {
        //     value: this.httpApi.apiEndpoint,
        // });
    }
}
