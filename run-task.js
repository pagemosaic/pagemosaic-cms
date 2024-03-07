const path = require('path');
const {readFileSync, existsSync} = require('fs');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const oraPromise = import('ora');

const tasks = {
    'bootstrap-platform': {
        title: 'The platform is being set up from the ground up. It might take roughly 5 to 10 minutes. Please be patient and wait for the process to complete.',
        short: 'Bootstrapping the platform',
        command: 'local-run turbo run bootstrap --filter=infra --no-color',
    },
    'build-platform': {
        title: 'The platform is currently being built. Please wait for completion.',
        short: 'Building the platform',
        command: 'local-run turbo run build --no-color'
    },
    'deploy-platform': {
        title: 'The platform is being deployed now. It might take approximately 5 to 10 minutes. Please wait for the process to finish.',
        short: 'Deploying the platform',
        command: 'local-run turbo run deploy --filter=infra --no-color'
    },
    'destroy-platform': {
        title: 'The platform is being destroyed. This process may take around 5 to 10 minutes. Please wait for it to complete.',
        short: 'Destroying the platform',
        command: 'local-run turbo run destroy --filter=infra --no-color'
    },
};

function printAddresses() {
    const envVarsFromFile = dotenv.config({ path: path.resolve(__dirname, './.env') }).parsed;
    let env = { ...envVarsFromFile };
    const stackName = env.STACK_NAME || '';
    const adminEmail = env.DEFAULT_ADMIN_EMAIL || '';
    const CDK_OUTPUT_FILE =  path.resolve(__dirname, './platform/infra/cdk-outputs.json');
    if (!existsSync(CDK_OUTPUT_FILE)) {
        console.error('Error: CDK output file not found');
        process.exit(1);
    }
    // Read and parse the CDK output file
    const cdkOutputs = JSON.parse(readFileSync(CDK_OUTPUT_FILE, 'utf8'));
    const entryPointDomainName = cdkOutputs[stackName]['EntryPointDomain'];
    console.log('===');
    console.log(`Please open the Website at: https://${entryPointDomainName}`);
    console.log(`Please open the Admin Panel at: https://${entryPointDomainName}/admin`);
    console.log('===');
    console.log(`If this is your first time deploying the platform, please check the inbox of the email address: ${adminEmail}`);
    console.log('===');
}

const runTask = async (taskName) => {
    const command = tasks[taskName].command;
    if (!command) {
        console.error(`Task "${taskName}" not found.`);
        process.exit(1);
    }

    const ora = await oraPromise;
    const spinner = ora.default(tasks[taskName].title).start();

    exec(command, (error, stdout, stderr) => {
        if (error) {
            spinner.fail(`${command.short} failed: ${error.message}`);
            console.error(stdout);
            console.error(stderr);
            process.exit(1);
        }
        if (stderr) {
            spinner.warn(stderr);
        }
        spinner.succeed(`${tasks[taskName].short} completed successfully.`);
        if (taskName === 'deploy-platform') {
            printAddresses();
        }
        // console.log(stdout);
    });
};

const taskName = process.argv[2]; // Gets the task name from command-line arguments
runTask(taskName);
