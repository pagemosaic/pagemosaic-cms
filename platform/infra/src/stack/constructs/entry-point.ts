import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export interface EntryPointConstructProps {
    httpApiGatewayOrigin: origins.HttpOrigin;
    systemBucket: s3.Bucket;
    systemBucketOAI: cloudfront.OriginAccessIdentity;
    publicBucket: s3.Bucket;
    publicBucketOAI: cloudfront.OriginAccessIdentity;
    domainNames?: Array<string>;
    certificateArn?: string;
}

export class EntryPointConstruct extends Construct {
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props: EntryPointConstructProps) {
        super(scope, id);

        // Create a cache policy for the Web HttpApi
        const webCachePolicy = new cloudfront.CachePolicy(this, 'WebCachePolicy', {
            minTtl: cdk.Duration.days(365),
            defaultTtl: cdk.Duration.days(365),
            maxTtl: cdk.Duration.days(365),
            comment: 'Cache policy for Web Http with 10 minutes TTL',
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true
        });

        const staticCachePolicy = new cloudfront.CachePolicy(this, 'StaticCachePolicy', {
            minTtl: cdk.Duration.days(365),
            defaultTtl: cdk.Duration.days(365),
            maxTtl: cdk.Duration.days(365),
            comment: 'Cache policy for static assets with 365 days default TTL',
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
        });

        const adminRewriteFunction = new cloudfront.Function(this, 'AdminRewriteFunction', {
            code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Check if the URI is for a file (has a file extension)
    if (!uri.match(/\\/[^\\/]*\\.[^\\/]*$/)) {
        // Not a file, rewrite to /admin/index.html
        request.uri = '/admin/index.html';
    }
    return request;
}
            `),
        });

        const entryRewriteFunction = new cloudfront.Function(this, 'EntryRewriteFunction', {
            code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Check if URI has no file extension
    if (!/\\.\\w+$/.test(uri)) {
        // If URI ends with '/', append 'index.html', otherwise append '.html'
        request.uri = uri.endsWith('/') ? uri + 'index.html' : uri + '.html';
    }

    return request;
}
            `),
        });

        // Create the CloudFront distribution
        const {domainNames, certificateArn} = props;
        this.distribution = new cloudfront.Distribution(this, 'EntryPointDistribution', {
            domainNames,
            defaultRootObject: 'index.html',
            certificate: certificateArn
                ? acm.Certificate.fromCertificateArn(this, 'CustomCertificate', certificateArn)
                : undefined,
            errorResponses: [
                {
                    httpStatus: 404, // Not Found error
                    responsePagePath: '/error404.html', // Path to the custom error page
                    responseHttpStatus: 404, // Optional: Set a custom HTTP status code for the response
                    ttl: cdk.Duration.seconds(600), // Cache the error response for 600 seconds
                }
            ],
            defaultBehavior: {
                origin: new origins.S3Origin(props.publicBucket, {
                    originAccessIdentity: props.publicBucketOAI
                }),
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: webCachePolicy,
                compress: true,
                functionAssociations: [{
                    function: entryRewriteFunction,
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                }],
                responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'WebEntryResponseHeadersPolicy', {
                    comment: 'Policy to include Cache-Control header for all files',
                    customHeadersBehavior: {
                        customHeaders: [
                            {
                                header: 'Cache-Control',
                                value: 'public, max-age=86400',
                                override: false
                            }
                        ]
                    }
                }),
            },
            additionalBehaviors: {
                '/api/*': {
                    origin: props.httpApiGatewayOrigin,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    compress: true
                },
                '/admin': {
                    origin: new origins.S3Origin(props.systemBucket, {
                        originAccessIdentity: props.systemBucketOAI
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    functionAssociations: [{
                        function: adminRewriteFunction,
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                    }],
                    compress: true
                },
                '/admin/*': {
                    origin: new origins.S3Origin(props.systemBucket, {
                        originAccessIdentity: props.systemBucketOAI
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    functionAssociations: [{
                        function: adminRewriteFunction,
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                    }],
                    compress: true
                },
                '/_assets/*': {
                    origin: new origins.S3Origin(props.publicBucket, {
                        originAccessIdentity: props.publicBucketOAI
                    }),
                    responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'WebAssetsResponseHeadersPolicy', {
                        comment: 'Policy to include Cache-Control header for assets files',
                        customHeadersBehavior: {
                            customHeaders: [
                                {
                                    header: 'Cache-Control',
                                    value: 'public, max-age=86400',
                                    override: false
                                }
                            ]
                        }
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: staticCachePolicy,
                    compress: true
                },
                '/_generated/*': {
                    origin: new origins.S3Origin(props.publicBucket, {
                        originAccessIdentity: props.publicBucketOAI
                    }),
                    responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'WebGeneratedResponseHeadersPolicy', {
                        comment: 'Policy to include Cache-Control header for generated files',
                        customHeadersBehavior: {
                            customHeaders: [
                                {
                                    header: 'Cache-Control',
                                    value: 'public, max-age=86400',
                                    override: false
                                }
                            ]
                        }
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: webCachePolicy,
                    compress: true
                },
                '/_static/*': {
                    origin: new origins.S3Origin(props.publicBucket, {
                        originAccessIdentity: props.publicBucketOAI
                    }),
                    responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'WebStaticResponseHeadersPolicy', {
                        comment: 'Policy to include Cache-Control header for static assets',
                        customHeadersBehavior: {
                            customHeaders: [
                                {
                                    header: 'Cache-Control',
                                    value: 'public, max-age=86400',
                                    override: false
                                }
                            ]
                        }
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: staticCachePolicy,
                    compress: true
                }
            }
        });
    }
}
