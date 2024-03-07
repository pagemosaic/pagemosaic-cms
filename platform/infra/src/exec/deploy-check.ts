import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const AWS_PROFILE_NAME = process.env.AWS_PROFILE_NAME;
const stackName = process.env.STACK_NAME || '';

if (!/^[A-Za-z0-9]+$/.test(stackName)) {
    console.error('Error: STACK_NAME should contain only letters and numbers.');
    process.exit(1);
}

console.log('Synthesizing the CloudFormation template...');
execSync(`cdk synth --profile ${AWS_PROFILE_NAME} > template.yaml`, { stdio: 'inherit' });

console.log('Creating a change set...');
const changeSetName = `changeset-${new Date().getTime()}`;
execSync(`aws cloudformation create-change-set --stack-name ${stackName} --change-set-name ${changeSetName} --template-body file://template.yaml --capabilities CAPABILITY_IAM --profile ${AWS_PROFILE_NAME}`, { stdio: 'inherit' });

console.log('Waiting for the change set to be created...');
execSync(`aws cloudformation wait change-set-create-complete --change-set-name ${changeSetName} --stack-name ${stackName} --profile ${AWS_PROFILE_NAME}`, { stdio: 'inherit' });

console.log('Describing the change set...');
const describeChangeSetOutput = execSync(`aws cloudformation describe-change-set --change-set-name ${changeSetName} --stack-name ${stackName} --profile ${AWS_PROFILE_NAME}`, { encoding: 'utf8' });

// Write the output to a file
const CHANGE_SET_OUTPUT_FILE = 'change-set-output.txt';
writeFileSync(CHANGE_SET_OUTPUT_FILE, describeChangeSetOutput);

// Rest of your deployment script...
