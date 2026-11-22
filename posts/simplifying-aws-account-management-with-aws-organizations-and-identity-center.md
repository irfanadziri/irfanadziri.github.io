# Simplifying AWS Account Management with AWS Organizations and Identity Center

> Simplifies AWS account management with centralized control, consolidated billing, and a setup guide for effective management.

- Type: Post
- Published: 2024-09-12
- Tags: aws, security
- Source: https://irfanadziri.dev/posts/simplifying-aws-account-management-with-aws-organizations-and-identity-center/

---

Managing multiple AWS accounts, whether for individual freelancers or companies, can become overwhelming. To overcome this, AWS Organizations and Identity Center offer a powerful way to ease this process, providing much simpler account management, centralized billing, and enhanced security.

In this article, we’ll explore the advantages of using AWS Organizations and Identity Center and guide you through setting them up.

## Why Use AWS Organizations and Identity Center?

Here are the key advantages of using AWS Organizations with Identity Center for account management:

### 1. **Centralized Account Management**

By grouping multiple AWS accounts under a single organization, account owner can manage everything centrally. This simplifies tasks like billing, access control, and policy enforcement.

### 2. **Consolidated Billing**

AWS Organizations allows for consolidated billing, meaning all member accounts’ usage is sum up into one bill. This is very helpful for tracking overall services cost and AWS also offer discounts through AWS pricing plans.

### 3. **Security and Isolation**

For a better security, isolating different projects with individual accounts is a must. If one project is compromised, it does not impact the others, keeping resources isolated.

### 4. **Simplified User Management with Identity Center**

AWS Identity Center makes it easy to manage user access to multiple accounts. Account owners may assign permissions once and apply them across all accounts, saving time and effort when granting or revoking access.

## Step-by-Step Tutorial: Setting Up AWS Organizations and Identity Center

Here’s how you can set up AWS Organizations and Identity Center for easier management of multiple AWS accounts.

### Step 1: Create an AWS Organization

1. Log in to AWS Management Console.
2. Navigate to **AWS Organizations** from the Services menu.
3. Click **Create Organization**. This enables creating new accounts or invite existing ones into the organization.

![AWS Organizations Dashboard](https://irfanadziri.dev/_astro/organizations-dashboard.CtaqLHZm_Z1FckJC.webp) _Screenshot: AWS Organizations Dashboard_

### Step 2: Add Accounts to Your Organization

1. Once the organization is created, you’ll see an option to **Add an Account**.
2. A new account can be created or existing AWS account can be invited to join the organization.

![AWS Organizations Add New Account](https://irfanadziri.dev/_astro/organizations-add.B3Ou4XjX_jWmGl.webp) _Screenshot: Adding New Account in AWS Organizations_

### Step 3: Enable AWS Identity Center

1. In the AWS Management Console, navigate to **AWS Identity Center** (formerly AWS Single Sign-On).
2. Click **Enable Identity Center**. This will allow you to manage access for users across all AWS accounts in the organization.

![Identity Center Dashboard](https://irfanadziri.dev/_astro/identity-center-dashboard.W5IN-I9t_13hdb9.webp) _Screenshot: AWS Identity Center Dashboard_

### Step 4: Create a User in Identity Center

1. Go to the **Users** tab in the Identity Center dashboard and click **Create User**.
2. Fill in the required details (username, email, etc.).
3. Once the user is created, you can assign them roles within your AWS accounts.

### Step 5: Assign Permission Sets

1. Under **Permission Sets**, click **Create Permission Set**.
2. Choose one of the predefined roles like **AdministratorAccess** or **PowerUserAccess**, or create a custom permission set.
3. Assign this permission set to your user across the AWS accounts they need access to.

### Step 6: Access AWS Accounts via Identity Center

1. From IAM Identity Center Dashboard; under the Settings Summary, copy the AWS access portal URL.
2. Once the users have been assigned permissions, they can log in to AWS using the Identity Center login portal.
3. From there, they can access any AWS account they have been granted permissions for.

![Identity Center Login](https://irfanadziri.dev/_astro/identity-center-login.Fj-xqSm3_2649Cf.webp) _Screenshot: IAM Identity Center User Login Page_

## Conclusion

The combination of AWS Organizations and Identity Center make it easier to manage multiple AWS accounts centrally. The benefits of centralized billing, user access control, and security isolation provide significant advantages.

Following the steps above, the AWS account management process is so much more centralized, allowing for smoother project execution and better cost control.

### Learn more on AWS official documentation here:

- [AWS Organizations](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html)
- [AWS Identity Center](https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html)
