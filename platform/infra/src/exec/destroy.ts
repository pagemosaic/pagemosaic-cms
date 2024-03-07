import {execSync} from 'child_process';
import {openSync, closeSync} from 'fs';
import {getSsmParameter, delSsmParameter} from '../common/aws/sysParameters';
import {deleteSSLCertificate} from '../common/aws/sslCertificate';
import {
    PARAM_PREVIEW_POINT_DOMAIN,
    PARAM_ENTRY_POINT_DOMAIN,
    PARAM_SYS_USER_POOL_ID,
    PARAM_SYS_USER_POOL_CLIENT_ID,
    PARAM_ENTRY_POINT_DISTRIBUTION_ID,
    PARAM_SSL_CERTIFICATE_ARN,
    PARAM_DOMAIN,
} from '../common/constants';

const AWS_PROFILE_NAME = process.env.AWS_PROFILE_NAME; // Get AWS profile name from environment variable

console.log('Please wait. Destroying resources...');
// Proceed with the CDK deployment
const log = openSync('cdk-destroy.log', 'w');
execSync(`cdk destroy --force --profile ${AWS_PROFILE_NAME}`, {stdio: ['ignore', log, log]});
closeSync(log);
// execSync(`cdk destroy --force --profile ${AWS_PROFILE_NAME}`, {stdio: 'inherit'});


async function finalCleaning(){
    const certificateArn = await getSsmParameter(PARAM_SSL_CERTIFICATE_ARN);

    await delSsmParameter(PARAM_ENTRY_POINT_DISTRIBUTION_ID);
    await delSsmParameter(PARAM_ENTRY_POINT_DOMAIN);
    await delSsmParameter(PARAM_PREVIEW_POINT_DOMAIN);
    await delSsmParameter(PARAM_SYS_USER_POOL_CLIENT_ID);
    await delSsmParameter(PARAM_SYS_USER_POOL_ID);
    await delSsmParameter(PARAM_DOMAIN);
    await delSsmParameter(PARAM_SSL_CERTIFICATE_ARN);

    if (certificateArn) {
        await deleteSSLCertificate(certificateArn);
    }
}

finalCleaning().catch(e => console.error(e));
