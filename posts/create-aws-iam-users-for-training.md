# Manage AWS Trainee Access with IAM User Setup

> Configuring IAM users with tailored permissions using a Role-based Access Control (RBAC) model.

- Type: Post
- Published: 2024-03-19
- Tags: aws, security
- Source: https://irfanadziri.dev/posts/create-aws-iam-users-for-training/

---

As a trainer, simplify your AWS training session and ensure a smooth start by pre-creating trainee accounts. Before following the steps in this tutorial, note the security consideration below, and ensure you have the following prerequisites:

⚠️ **Caution**: By following this tutorial, you’ll provide your trainees access to your personal account’s EC2 resources. Please create a dedicated root account just for training purposes.

**Pre-requisites**:

- Root AWS account.
- Basic AWS IAM knowledge.

This tutorial consist of two sections; IAM Configuration and Creating Users Using AWS CLI.

## IAM Configuration

1. In AWS console, navigate to IAM. Under Access Management menu, click on **Policies**.
2. Click on **Create policy** and choose JSON in the policy editor.
3. Paste this JSON; which defines the permissions for the trainees’ accounts:[1](#user-content-fn-1)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:TerminateInstances",
        "ec2:RunInstances",
        "ec2-instance-connect:SendSSHPublicKey",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "iam:ChangePassword",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:DescribeAlarmsForMetric",
        "cloudwatch:ListMetrics",
        "cloudwatch:GetMetricData"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "ec2:RunInstances",
      "Resource": ["arn:aws:ec2:<region>:<account-id>:instance/*"],
      "Condition": {
        "StringEquals": {
          "ec2:InstanceType": "t2.micro"
        }
      }
    },
    {
      "Effect": "Deny",
      "Action": "ec2:RunInstances",
      "Resource": "arn:aws:ec2:<region>::image/*",
      "Condition": {
        "StringNotEquals": {
          "ec2:ImageId": "ami-06c4be2792f419b7b"
        }
      }
    }
  ]
}
```

4. Click **Next**.
5. Give the policy a name (e.g. ec2-trainee-policy), then click on **Create policy**.
6. Once created, go back to IAM dashboard and click on **User groups** under Access Management menu.
7. Click on **Create group**.
8. Give the group a name (e.g. ec2-trainee-group) and search for policy created earlier under **Attach permissions policies - Optional** menu.
9. Click on **Create group**.

## Creating Users Using AWS CLI

1. Click on CLI icon on navbar.
2. Run this command and wait for it to finish[2](#user-content-fn-2):

```shell
for i in {1..10}; do
  aws iam create-user --user-name trainee-user$i &&
  aws iam add-user-to-group --user-name trainee-user$i --group-name ec2-trainee-group &&
  aws iam create-login-profile --user-name trainee-user$i --password myPwd@123 --password-reset-required
  echo "-------------------------------------------------------------------------------------------------"
done
```

3. AWS will create new users with usernames ranging from `trainee-user1` until `trainee-user10`. The default password for all users will be `myPwd@123`. Make sure to record these credentials securely to distribute to your trainees later for AWS console login.
4. Provide a sign-in url to trainees with their designated credentials to login here: `https://<your-account-id>.signin.aws.amazon.com/console/`.
5. AWS will prompt users to change their password after the first-time login.

**Important notes**:

- This tutorial assumes you want to restrict trainees to launching only instances with the **Ubuntu Server 22.04 LTS (HVM)** image and **t2.micro** instance type.
- This tutorial also does not prevent trainees from accessing instances launched by other trainees because it relies on a basic access control model. For more granular control and to isolate trainee resources, consider using Attribute-based Access Control (ABAC). You can find more information [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction_attribute-based-access-control.html) or read the setup tutorial [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_attribute-based-access-control.html).
- To avoid unintended costs and prevent further usage, terminate all instances created by trainees after each training session and consider removing their IAM user accounts.

1. Change the region and account id to yours respectively. [↩](#user-content-fnref-1)

2. The number 10 is just an example. You may change based on how many trainees you have. The **—user-name**, **—group-name**, and **—password** are also changeable. [↩](#user-content-fnref-2)
