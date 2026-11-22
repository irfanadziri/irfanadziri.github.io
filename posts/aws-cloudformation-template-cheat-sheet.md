# AWS CloudFormation Template Cheat Sheet

> AWS CloudFormation quick cheat sheet. Understand key components, get tips on avoiding common errors, and start with a basic example template.

- Type: Post
- Published: 2024-06-24
- Tags: aws, cloudformation
- Source: https://irfanadziri.dev/posts/aws-cloudformation-template-cheat-sheet/

---

AWS CloudFormation is a powerful tool that allows the definition of cloud infrastructure as code(IaC). This cheat sheet provides a quick reference for creating and managing CloudFormation templates in YAML format.

**Note:** CloudFormation templates can also be written in JSON.

## 1. Basic Template Structure

### Main Template

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: Main CloudFormation stacks # Provide a meaningful description of your stack

Resources: # Define all resources needed for infrastructure deployment
  IAMStack: # Resource stack name
    Type: "AWS::CloudFormation::Stack" # Specify the type of resource, in this case, a nested stack
    Properties:
      TemplateURL: "https://s3.ap-southeast-1.amazonaws.com/<bucket-name>/IAM-stack.yaml" # URL to the nested stack template

  VPCStack:
    Type: "AWS::CloudFormation::Stack"
    Properties:
      TemplateURL: "https://s3.ap-southeast-1.amazonaws.com/<bucket-name>/VPC-stack.yaml"

  EC2Stack:
    Type: "AWS::CloudFormation::Stack"
    Properties:
      TemplateURL: "https://s3.ap-southeast-1.amazonaws.com/<bucket-name>/EC2-stack.yaml"
      Parameters: # Parameters required by the EC2 stack
        SecurityGroupIds: !ImportValue BastionSecurityGroup # Import value from the output of another stack
        PublicSubnet1Id: !ImportValue PublicSubnetId
        PublicSubnet2Id: !ImportValue PrivateSubnetId
```

### Stack Template

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: CloudFormation stack for infrastructure VPC

Resources:
  VPC:
    Type: "AWS::EC2::VPC"
    Properties:
      CidrBlock: "10.0.0.0/16" # Define the CIDR block for the VPC
      EnableDnsSupport: true # Enable DNS support within the VPC
      EnableDnsHostnames: true # Enable DNS hostnames within the VPC
      Tags:
        - Key: Name
          Value: myVPC # Tag the VPC with a name

  PublicSubnet:
    Type: "AWS::EC2::Subnet"
    Properties:
      VpcId: !Ref VPC # Reference the VPC resource created above
      CidrBlock: "10.0.1.0/24" # Define the CIDR block for the subnet
      AvailabilityZone: ap-southeast-1a # Specify the availability zone
      MapPublicIpOnLaunch: true # Automatically assign a public IP to instances launched in this subnet

  PrivateSubnet:
    Type: "AWS::EC2::Subnet"
    Properties:
      VpcId: !Ref VPC
      CidrBlock: "10.0.2.0/24"
      AvailabilityZone: ap-southeast-1b
      MapPublicIpOnLaunch: false # No public IP assigned by default

  IGW:
    Type: "AWS::EC2::InternetGateway" # Create an Internet Gateway

  BastionSecurityGroup:
    Type: "AWS::EC2::SecurityGroup"
    Properties:
      GroupDescription: Allow SSH inbound traffic from all sources # Description of the security group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: "0.0.0.0/0" # Allow SSH from any IP

Outputs: # Define outputs to be used in other stacks
  VPCId:
    Description: "VPC ID"
    Value: !Ref VPC
    Export:
      Name: "VPCId" # Export the VPC ID for use in other stacks

  PublicSubnetId:
    Description: "Public Subnet 1 ID"
    Value: !Ref PublicSubnet
    Export:
      Name: "PublicSubnetId"

  PrivateSubnetId:
    Description: "Private Subnet 2 ID"
    Value: !Ref PrivateSubnet
    Export:
      Name: "PrivateSubnetId"

  BastionSecurityGroupId:
    Description: "Bastion Security Group ID"
    Value: !Ref BastionSecurityGroup
    Export:
      Name: "BastionSecurityGroupId"
```

## 2. Parameters

Parameters are used to customize templates.

```yaml
Parameters:
  InstanceType:
    Description: "EC2 instance type"
    Type: String
    Default: t2.micro
    AllowedValues:
      - t2.micro
      - t2.small
      - t2.medium
    ConstraintDescription: "Must be a valid EC2 instance type."
```

## 3. Outputs

Outputs allow exporting values from one stack to be used in another.

```yaml
Outputs:
  VPCId:
    Description: "VPC ID"
    Value: !Ref VPC
    Export:
      Name: "VPCId"
```

## 4. Common Errors and Troubleshooting Tips

- **Syntax Errors**: Always validate templates using the AWS CloudFormation console or CLI.
- **Resource Conflicts**: Ensure unique names for resources to avoid conflicts.
- **Parameter Mismatch**: Verify that parameter names and types match across templates.

## Conclusion

Using CloudFormation to manage IaC can greatly simplify deployment and management tasks. Start experimenting with templates and see the benefits firsthand.

## Additional Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html)
- [AWS CloudFormation Sample Templates](https://aws.amazon.com/cloudformation/resources/templates/)

**Disclaimer**: This example template is for educational purposes only and should not be copied for production use. It serves as a guide to understand the basic structure of a CloudFormation template.
