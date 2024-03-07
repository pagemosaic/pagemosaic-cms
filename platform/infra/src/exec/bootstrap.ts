import {execSync} from 'child_process';
import {openSync, closeSync} from 'fs';

const AWS_PROFILE_NAME = process.env.AWS_PROFILE_NAME; // Get AWS profile name from environment variable

console.log('Please wait. Bootstraping resources...');
// Proceed with the CDK deployment
const log = openSync('cdk-bootstrap.log', 'w');
execSync(`cdk bootstrap --profile ${AWS_PROFILE_NAME}`, {stdio: ['ignore', log, log]});
closeSync(log);
// execSync(`cdk bootstrap --profile ${AWS_PROFILE_NAME}`, {stdio: 'inherit'});
