# Page Mosaic CMS

Page Mosaic CMS is an open-source platform optimized for AWS to efficiently host static websites.
It simplifies the process of creating, managing, and publishing content online with an emphasis on cost-effectiveness and efficient use of AWS resources.

[Check out the Page Mosaic website for more info.](https://pagemosaic.com)

## Technical Overview
### AWS-Based Serverless Architecture
* `Hosted on AWS:` Utilizing Amazon Web Services for reliable, scalable cloud infrastructure.
* `Serverless Design:` Employs AWS services like Lambda, CloudFront, and S3 to create a serverless architecture, optimizing for efficiency and scalability.

### Key AWS Services
* `AWS Lambda:` Manages backend processes without dedicated servers, triggering functions as needed.
* `Amazon CloudFront:` Acts as the content delivery network, enhancing global content delivery speed and security.
* `Amazon S3:` Used for secure and scalable storage of files and data.

### Deployment
* `AWS Cloud Development Kit (CDK):` Infrastructure defined and deployed using CDK, simplifying the deployment process through Command Line Interface (CLI), even for users with minimal technical background.

> Concerns about unnecessary resource accumulation in your account are mitigated.
> Utilizing the AWS CDK, which employs CloudFormation, the project ensures that all resources are encapsulated within a single CloudFormation Stack.
>
>This approach simplifies resource management, allowing for the straightforward removal of all resources associated with this stack when no longer needed.

### Admin Panel
* `Technologies Used:` Developed with React and TailwindCSS. React for building the user interface, TailwindCSS for styling.
* `User Interface Components:` Includes various components for managing system features and AWS resources.

[Check out the Page Mosaic website for more info.](https://pagemosaic.com)

## Setting up AWS

### Create an administrative user on AWS and configure AWS CLI locally

Before deploying the project, you must create an administrative user on your AWS account and configure the AWS CLI on your computer.

### Install CDK

* Use the following command to install the AWS Cloud Development Kit (CDK) Toolkit globally on your system:
```shell
npm install -g aws-cdk
```

## Deployment & Usage

Once you have successfully created an administrative user and set up AWS CLI access, you can proceed to build and deploy the project on your account. 
You will need to specify the necessary credentials for AWS CDK to initialize the resources correctly.

### Deployment

* Change the `.env.example` file name to `.env` and edit its contents. Specifically, include the following variables:
   * `STACK_NAME` - any name you like. You can check existing stacks in the AWS console under CloudFormation.
   * `AWS_REGION` - the name of the AWS region where resources will be deployed (some resources like CloudFront will be deployed globally)
   * `AWS_PROFILE_NAME` - the profile name for AWS CLI authorization (see the video above)
   * `DEFAULT_ADMIN_EMAIL` - the administrative user's email (see the video above)


* Install dependencies:
```shell
pnpm install
```

* Run CDK Bootstrap (only once if not previously done):
```shell
pnpm bootstrap-platform
```

* Now you can deploy the project on AWS. Run the following command in the project's root directory:
```shell
pnpm deploy-platform
```

### Usage

After a successful deployment, you will see a prompt in the command line to open the website with the specified address. When you open the site in a browser, you will see empty page. To add content, you need to go to the Admin Panel.

Only the administrator, whose email you provided in the `.env` file before deployment, has access to the Admin Panel. However, to successfully log in, you must complete the registration of the site administrator's account.

Therefore, open the administrator's email and find the letter titled **"Page Mosaic Email Verification"**. Follow the link in the letter.

This will open a form to validate the administrator's email. Enter the default password that was assigned:
```
DefaultPassword1!
```

## Undeploy CMS instance

To remove resources created on AWS during deployment, run the command:
```shell
pnpm destroy-platform
```

**Warning!!!** Not all created and deployed resources on AWS account will be erased. You have to delete manually the S3 buckets and DynamoDB tables.

<br/>
<br/>

[Check out the Page Mosaic website for more info.](https://pagemosaic.com)

## License

GPL-3.0-only

---

Follow [Alex Pust](https://twitter.com/alex_pustovalov) on Twitter for updates on the Page Mosaic CMS development.
