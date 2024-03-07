#!/usr/bin/env node
const { exec, execSync, spawn } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file located two levels up
const envFilePath = path.resolve(__dirname, '../../.env');

const envVarsFromFile = dotenv.config({ path: envFilePath }).parsed;

// Initialize the environment object with variables from .env file
let env = { ...envVarsFromFile };
// Extract AWS_PROFILE_NAME from loaded environment variables
const AWS_PROFILE_NAME = env.AWS_PROFILE_NAME;

if (!AWS_PROFILE_NAME) {
    console.log('Error: Missing AWS user profile name. Set AWS_PROFILE_NAME in your environment.');
    process.exit(1);
}

// Check if the AWS session is valid
try {
    execSync(`aws s3 ls --profile ${AWS_PROFILE_NAME}`, {stdio: 'ignore'});
    console.log('The AWS session is still valid.');
} catch (error) {
    console.log('The AWS session is expired. Initiating AWS SSO login...');
    execSync(`aws sso login --profile ${AWS_PROFILE_NAME}`, {stdio: 'inherit'});
}

function parseEnvString(envString) {
    return envString.split('\n')
        .filter(line => line.trim() !== '' && !line.startsWith('#'))
        .map(line => line.replace(/^export\s+/, '')) // Remove 'export' keyword
        .reduce((env, line) => {
            const [key, value] = line.split('=');
            env[key.trim()] = value.trim();
            return env;
        }, {});
}

function setAWSCredentials(callback) {
    exec(`aws configure export-credentials --profile ${AWS_PROFILE_NAME} --format env`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }

        // Parsing the AWS command output and adding it to the env object
        const awsCredentials = parseEnvString(stdout);
        Object.assign(env, awsCredentials);

        callback(); // Proceed to run the npm script after setting the credentials
    });
}

function runCommand(command) {
    const workingDir = process.cwd();

    // Split the command into the command and arguments
    const [cmd, ...args] = command;

    const childProcess = spawn(cmd, args, {
        env: { ...process.env, ...env }, // Combine process.env and your custom env
        cwd: workingDir,
        stdio: 'inherit' // Inherit stdio to make child process use parent's stdio
    });

    childProcess.on('error', (err) => {
        console.error(`Failed to start command: ${err.message}`);
    });

    childProcess.on('close', (code) => {
        console.log(`Command exited with code ${code}`);
    });

    process.on('SIGTERM', () => childProcess.kill('SIGTERM'));
    process.on('SIGINT', () => childProcess.kill('SIGINT'));
    process.on('SIGBREAK', () => childProcess.kill('SIGBREAK'));
    process.on('SIGHUP', () => childProcess.kill('SIGHUP'));
    childProcess.on('exit', (code, signal) => {
        let crossEnvExitCode = code
        if (crossEnvExitCode === null) {
            crossEnvExitCode = signal === 'SIGINT' ? 0 : 1
        }
        process.exit(crossEnvExitCode);
    });
}

// Set AWS credentials and then run the npm script
setAWSCredentials(() => {
    // Fetch credentials from environment variables
    const awsAccessKeyId = env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = env.AWS_SECRET_ACCESS_KEY;

    if (!awsAccessKeyId || !awsSecretAccessKey) {
        console.error('Error: AWS credentials not found in environment variables.');
        process.exit(1);
    }
    const command = process.argv.slice(2);
    runCommand(command);
});
