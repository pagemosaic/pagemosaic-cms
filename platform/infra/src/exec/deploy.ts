import {execSync} from 'child_process';
import {readFileSync, existsSync, openSync, closeSync} from 'fs';
import {
    ListUsersCommand,
    CognitoIdentityProviderClient,
    SignUpCommand,
    ListUsersResponse
} from '@aws-sdk/client-cognito-identity-provider';
import {
    PARAM_PREVIEW_POINT_DOMAIN,
    PARAM_ENTRY_POINT_DOMAIN,
    PARAM_SYS_USER_POOL_ID,
    PARAM_SYS_USER_POOL_CLIENT_ID,
    PARAM_ENTRY_POINT_DISTRIBUTION_ID,
    INFRA_PREVIEW_POINT_DOMAIN,
    INFRA_ENTRY_POINT_DOMAIN,
    INFRA_SYS_USER_POOL_ID,
    INFRA_SYS_USER_POOL_CLIENT_ID,
    INFRA_ENTRY_POINT_DISTRIBUTION_ID,
    BUCKET_DOCUMENTS_DIR,
    PLATFORM_DOCUMENTS_TABLE_NAME,
    DI_TEMPLATE_ENTRY_TYPE,
    PLATFORM_SYSTEM_BUCKET_NAME,
    PLATFORM_PUBLIC_BUCKET_NAME
} from '../common/constants';
import {getCognitoClient} from '../common/aws/sysAuth';
import {putSsmParameter} from '../common/aws/sysParameters';
import {DI_EntrySlice, DI_Generator, DI_SiteEntry} from '../common/data/DocumentItem';
import {
    getEntrySliceByEntryType,
    getGenerator,
    createGenerator,
    getSiteEntry,
    createSiteEntry
} from '../common/dao/documentDao';
import {writeFileContentAsString} from '../common/aws/bucket';
import {createOrUpdateItem} from '../common/aws/database';
import {BasicItem} from '../common/data/BasicItem';
import {
    defaultTemplateEntry,
    defaultTemplateId,
    defaultPageEntry
} from '../common/utility/defaultTemplateEntry';
import {defaultRobots, defaultIndexPage, defaultError404Page} from '../common/utility/defaultInitialFiles';

const AWS_PROFILE_NAME = process.env.AWS_PROFILE_NAME;
const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL;
const stackName = process.env.STACK_NAME || '';

if (!/^[A-Za-z0-9]+$/.test(stackName)) {
    console.error('Please make sure that the name you use for the STACK_NAME consists of letters and numbers only. Special characters are not allowed.');
    process.exit(1);
}

console.log('Please wait. Deploying resources...');
// Proceed with the CDK deployment
const CDK_OUTPUT_FILE = 'cdk-outputs.json';
const log = openSync('cdk-deploy.log', 'w');
execSync(`cdk deploy --require-approval never --auto-approve --outputs-file ${CDK_OUTPUT_FILE} --profile ${AWS_PROFILE_NAME}`, {stdio: ['ignore', log, log]});
closeSync(log);
// execSync(`cdk deploy --require-approval never --auto-approve --outputs-file ${CDK_OUTPUT_FILE} --profile ${AWS_PROFILE_NAME}`, {stdio: 'inherit'});

// console.log('Reading output.');
// Check if the output file was created
if (!existsSync(CDK_OUTPUT_FILE)) {
    console.error('Error: CDK output file not found');
    process.exit(1);
}

// Read and parse the CDK output file
const cdkOutputs = JSON.parse(readFileSync(CDK_OUTPUT_FILE, 'utf8'));
const entryPointDomainName = cdkOutputs[stackName][INFRA_ENTRY_POINT_DOMAIN];
const entryPointDistributionId = cdkOutputs[stackName][INFRA_ENTRY_POINT_DISTRIBUTION_ID];
const previewPointDomainName = cdkOutputs[stackName][INFRA_PREVIEW_POINT_DOMAIN];
const sysUserPoolId = cdkOutputs[stackName][INFRA_SYS_USER_POOL_ID];
const sysUserPoolClientId = cdkOutputs[stackName][INFRA_SYS_USER_POOL_CLIENT_ID];

const postDeploy = async () => {
    try {
        await putSsmParameter(PARAM_ENTRY_POINT_DOMAIN, entryPointDomainName);
        await putSsmParameter(PARAM_PREVIEW_POINT_DOMAIN, previewPointDomainName);
        await putSsmParameter(PARAM_SYS_USER_POOL_ID, sysUserPoolId);
        await putSsmParameter(PARAM_SYS_USER_POOL_CLIENT_ID, sysUserPoolClientId);
        await putSsmParameter(PARAM_ENTRY_POINT_DISTRIBUTION_ID, entryPointDistributionId);

        const cognitoClient: CognitoIdentityProviderClient = await getCognitoClient();
        // Check if there are existing users in the Sys User Pool
        const listUsersResponse: ListUsersResponse = await cognitoClient.send(new ListUsersCommand({ UserPoolId: sysUserPoolId }));
        if (listUsersResponse && listUsersResponse.Users && listUsersResponse.Users.length === 0) {
            const response = await cognitoClient.send(new SignUpCommand({
                ClientId: sysUserPoolClientId,
                Username: defaultAdminEmail,
                Password: 'DefaultPassword1!',
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: defaultAdminEmail
                    },
                    {
                        Name: 'name',
                        Value: 'Admin User'
                    },
                ]
            }));
            console.log("Sign up successful.", response);
        }

        let foundEntries: Array<DI_EntrySlice> = await getEntrySliceByEntryType({S: DI_TEMPLATE_ENTRY_TYPE});
        if (foundEntries.length === 0) {
            const {Entry: TemplateEntry, Content: TemplateContent, Meta: TemplateMeta, Html, Styles} = defaultTemplateEntry;
            if (TemplateEntry && TemplateContent && TemplateMeta && Html && Styles) {
                TemplateEntry.EntryCreateDate.N = Date.now().toString();
                TemplateEntry.EntryUpdateDate.N = Date.now().toString();
                await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, TemplateEntry);
                await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, TemplateMeta);
                await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, TemplateContent);
                await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${defaultTemplateId}/templateHtml.html`, Html, 'text/html');
                await writeFileContentAsString(PLATFORM_SYSTEM_BUCKET_NAME, `${BUCKET_DOCUMENTS_DIR}/${defaultTemplateId}/templateStyles.css`, Styles, 'text/css');
            }
            const {Entry: PageEntry, Meta: PageMeta, Content: PageContent, Article: PageArticle} = defaultPageEntry;
            if (PageEntry && PageMeta && PageContent && PageArticle) {
                PageEntry.EntryCreateDate.N = Date.now().toString();
                PageEntry.EntryUpdateDate.N = Date.now().toString();
                await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, PageEntry);
                await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, PageMeta);
                await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, PageContent);
                await createOrUpdateItem<BasicItem>(PLATFORM_DOCUMENTS_TABLE_NAME, PageArticle);
            }
            await writeFileContentAsString(PLATFORM_PUBLIC_BUCKET_NAME, 'index.html', defaultIndexPage, 'text/html');
            await writeFileContentAsString(PLATFORM_PUBLIC_BUCKET_NAME, 'error404.html', defaultError404Page, 'text/html');
            await writeFileContentAsString(PLATFORM_PUBLIC_BUCKET_NAME, 'robots.txt', defaultRobots, 'text/plain');
        }
        let foundGenerator: DI_Generator = await getGenerator();
        if (!foundGenerator.Status) {
            await createGenerator();
        }
        let foundSiteEntry: DI_SiteEntry = await getSiteEntry();
        if (!foundSiteEntry.Entry) {
            await createSiteEntry();
        }
    } catch (error) {
        console.error("Error during post-deploy.", error);
    }
};

postDeploy()
    .then(() => {
        console.log('The platform has been successfully deployed.');
        console.log(`Please open the website at: https://${entryPointDomainName}`);
        console.log(`Please open the Admin Panel at: https://${entryPointDomainName}/admin`);
    })
    .catch(error => {
        console.error(error.message);
    });
