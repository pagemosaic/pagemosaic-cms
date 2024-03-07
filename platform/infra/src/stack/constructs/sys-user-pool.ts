import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {RemovalPolicy} from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import {PARAM_ENTRY_POINT_DOMAIN} from '../../common/constants';

export class SysUserPoolConstruct extends Construct {
    public readonly userPool: cognito.UserPool;
    public readonly userPoolClient: cognito.UserPoolClient;
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const emailLambda = new lambda.Function(this, 'SysUserVerificationEmailLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
                const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
                const ssmClient = new SSMClient();
                async function getSsmParameter(parameterName) {
                    const command = new GetParameterCommand({ Name: parameterName });
                    const response = await ssmClient.send(command);
                    if (!response.Parameter?.Value) {
                        throw new Error(\`Parameter \${parameterName} not found\`);
                    }
                    return response.Parameter.Value;
                }
                exports.handler = async (event) => {
                    if (event.triggerSource === 'CustomMessage_SignUp' || event.triggerSource === 'CustomMessage_ResendCode') {
                        const { codeParameter, userAttributes: {name, email} } = event.request;
                        const domainName = await getSsmParameter('${PARAM_ENTRY_POINT_DOMAIN}');
                        const customUrl = \`https://\${domainName}/admin/sign-up?username=\${email}&code=\${codeParameter}\`;
                        event.response.emailSubject = "Page Mosaic Email Verification";
                        event.response.emailMessage = \`Hello, \${name}. You received this letter because you sign up to Page Mosaic Web Platform as administrator.\\n\\nPlease go to this url to complete the sign up: \${customUrl}\`;
                    } else if (event.triggerSource === 'CustomMessage_ForgotPassword') {
                        const { codeParameter, userAttributes: {name, email} } = event.request;
                        const domainName = await getSsmParameter('${PARAM_ENTRY_POINT_DOMAIN}');
                        const customUrl = \`https://\${domainName}/admin/password-recovery?username=\${email}&code=\${codeParameter}\`;
                        event.response.emailSubject = "Page Mosaic Forgot Password Recovery";
                        event.response.emailMessage = \`Hello, \${name}. It seems that you forgot your password.\\n\\nPlease go to this url to complete the password recovery: \${customUrl}\`;                        
                    }
                    return event;
                };
           `),
        });

        // Grant the Lambda function permission to read all SSM parameters
        emailLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
            resources: [`arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/*`],
        }));

        this.userPool = new cognito.UserPool(this, 'SysUserPool', {
            // User pool properties
            selfSignUpEnabled: true, // Allow users to sign themselves up
            userVerification: {
                emailStyle: cognito.VerificationEmailStyle.CODE,
            },
            signInAliases: {
                email: true,
                // You can also add phone, username, etc. depending on your requirements
            },
            standardAttributes: {
                fullname: {
                    required: true,
                    mutable: false,
                },
                // Add other standard attributes as needed
            },
            // Add custom attributes if required
            passwordPolicy: {
                minLength: 8,
                requireLowercase: false,
                requireUppercase: false,
                requireDigits: false,
                requireSymbols: false,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            lambdaTriggers: {
                customMessage: emailLambda,
            },
            removalPolicy: RemovalPolicy.DESTROY
        });

        this.userPoolClient = new cognito.UserPoolClient(this, 'SysUserPoolClient', {
            userPool: this.userPool,
            authFlows: {
                userPassword: true
            }
        });
    }
}
