# Page Mosaic CMS

The project is tailored for deployment on the AWS platform. To get started, you'll need to set up a new AWS account or utilize an existing one.

> Concerns about unnecessary resource accumulation in your account are mitigated.
> Utilizing the AWS CDK, which employs CloudFormation, the project ensures that all resources are encapsulated within a single CloudFormation Stack.
> 
>This approach simplifies resource management, allowing for the straightforward removal of all resources associated with this stack when no longer needed.

Designed for convenience, the project's architecture enables the deployment of all required resources through a single command.

## Setting up AWS tools and environment on a local computer.

### Create an administrative user on AWS and configure AWS CLI locally

Before deploying the project, you must create an administrative user on your AWS account and configure the AWS CLI on your computer, as shown in the video below.
   <p align="center">
      <a href="https://youtu.be/5_UlOTywdOA" target="_blank">
   <img src="https://github.com/pagemosaic/.github/blob/e78b5f8dc9587d939d19de70446be7124bef94a5/images/og/youtube_video_cover_image-min.png" alt="Video 1" width="45%"/>
      </a>
   </p>

### Install CDK

* Use the following command to install the AWS Cloud Development Kit (CDK) Toolkit globally on your system:
```shell
npm install -g aws-cdk
```

<br/>
<br/>

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

## Undeploy website instance

To remove resources created on AWS during deployment, run the command:
```shell
pnpm destroy-platform
```

**Warning!!!** Not all created and deployed resources on AWS account will be erased. You have to delete manually the S3 buckets and DynamoDB tables.

<br/>
<br/>

## License

GPL-3.0-only

---

Follow [Alex Pust](https://twitter.com/alex_pustovalov) on Twitter for updates on the Page Mosaic CMS development.
