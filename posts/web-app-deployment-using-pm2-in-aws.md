# Web-App Deployment using PM2 in AWS

> Configuring web-app deployment using PM2 in EC2 utilizing launch template, and semi CI/CD implementation using S3.

- Type: Post
- Published: 2024-08-20
- Tags: aws, ci-cd, linux
- Source: https://irfanadziri.dev/posts/web-app-deployment-using-pm2-in-aws/

---

Deploying web applications on AWS EC2 instances is a common task for cloud engineers. However, ensuring that the deployment is seamless, automated, and manageable requires careful consideration of the tools and configurations used. This guide walks through the process of deploying a web application using PM2 on an AWS EC2 instance, leveraging a Launch Template for consistency and efficiency, and implementing a semi CI/CD pipeline using S3.

## Setting Up the EC2 Launch Template

To streamline the creation of EC2 instances, an AWS Launch Template is used. This template specifies the instance type, AMI, security group, and user data script that configures the instance upon launch.

Here’s the configuration for the Launch Template:

```yaml
LaunchTemplate:
  Type: "AWS::EC2::LaunchTemplate"
  Properties:
    LaunchTemplateData:
      InstanceType: "c5a.large" # Compute optimized instance with 2 vCPU and 4 GiB memory
      ImageId: "ami-060e277c0d4cce553" # Ubuntu 22.04 LTS image
      KeyName: "<keypair-name>"
      IamInstanceProfile:
        Name: "<IAM-instance-profile-name>"
      SecurityGroupIds:
        - "<security-group-id>"
      UserData:
        Fn::Base64: |
          #!/bin/bash -l

          # Update package index
          apt update

          # Install necessary packages
          apt install -y nginx unzip curl

          # Install NVM (Node Version Manager)
          curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
          [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
          nvm install --lts
          nvm use --lts

          # Install PM2 and Bun globally
          npm install -g pm2 bun
          pm2 startup systemd -u $USER --hp $HOME

          # Install AWS-CLI
          curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
          unzip awscliv2.zip
          ./aws/install

          # Variables
          S3_PATH="s3://<bucket-name>"
          LOCAL_PATH="/home/ubuntu/<bucket-name>"
          FILE_TO_CHECK="<src-code-file>.zip"
          APP_NAME="<app-name>"

          # Wait for the source code to be available in S3
          while true; do
            aws s3 ls $S3_PATH/$FILE_TO_CHECK
            && break
            || echo "Waiting for source code to be available in S3..."
            && sleep 300
          done

          # Sync source code from S3
          mkdir -p $LOCAL_PATH
          aws s3 sync $S3_PATH $LOCAL_PATH
          unzip $LOCAL_PATH/$FILE_TO_CHECK -d $LOCAL_PATH/
          rm $LOCAL_PATH/$FILE_TO_CHECK
          echo "Source code pulled from S3 to $LOCAL_PATH"

          # Move source code to web directory
          mkdir -p /var/www/$APP_NAME
          mv $LOCAL_PATH/* /var/www/$APP_NAME/
          cd /var/www/$APP_NAME

          # Install dependencies and build the application
          bun install --frozen-lockfile
          bun run build

          # Start the application with PM2
          pm2 start ecosystem.config.cjs
          pm2 save

          # Configure Nginx
          cat > /etc/nginx/sites-available/$APP_NAME <<- EOF
          server {
              listen 80;
              server_name <domain.com>;
              
              location / {
                  proxy_pass http://localhost:3000;
                  proxy_http_version 1.1;
                  proxy_set_header Upgrade \$http_upgrade;
                  proxy_set_header Connection 'upgrade';
                  proxy_set_header Host \$host;
                  proxy_cache_bypass \$http_upgrade;
              }
          }
          EOF
          ln -s /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
          rm /etc/nginx/sites-enabled/default

          # Restarting server
          systemctl restart nginx
          pm2 restart all
```

### Explanation and pre-requisite

- `InstanceType` - **c5a.large** is chosen as instance for compute optimization, suitable for applications that need high processing power with cost-optimization in mind.
- `ImageId` - The AMI used is **Ubuntu 22.04 LTS**, which provides long-term support and stability.
- `SecurityGroupIds` - Ensure that security group configured allows traffic on the necessary ports, especially **port 80** for HTTP traffic.
- `UserData` - This section automates the initial one-time setup for the instance. It **installs necessary packages** like Nginx, Node.js, PM2, and AWS CLI, sets up Nginx as a reverse proxy, and fetches the application code from S3.
- `bun install && bun run build` - This assumes that bun is used as the package manager for installing application dependencies. Alternatives like npm, yarn, etc. can also be used here.
- Ensure that `<IAM-instance-profile-name>` created has necessary permission to read from S3 bucket, specifically the permission of `s3:GetObject`.
- Ensure that `<keypair-name>`, `<IAM-instance-profile-name>`, `<security-group-id>`, `<bucket-name>`, `<app-name>`, and `<domain.com>` parameters are replaced with their respective values.

## Semi CI/CD Implementation using S3

For a semi CI/CD approach, the application code is uploaded to an S3 bucket. The EC2 instance continuously checks the S3 bucket for the presence of the deployment package and deploys it once available. But to be safe, upload the compressed source-code in the S3 bucket first before launching an EC2 using this template. This method is useful for environments where a full CI/CD pipeline isn’t feasible or required.

## Disclaimer

- **CloudFormation**: This template is written in YAML for deployment via CloudFormation. A solid understanding of CloudFormation is essential.
- **Non-Rapid Patching Environments**: This solution is designed for applications that do not require rapid patching. It doesn’t fully integrate with a CI/CD pipeline but instead relies on an S3 bucket to store the source code. This approach is more manual and may not be ideal for high-frequency updates.
- **Auto Scaling Group (ASG) Considerations**: Since this setup doesn’t use a golden image, which would typically contain a pre-configured environment, consider lowering the threshold of the ASG to reduce boot time. The reasoning behind not using a golden image is to ensure that the installed packages are always up to date.

The original article was authored by Aerrata and sourced from [here](https://aerrata.github.io/posts/deploy-nuxt-app-on-ubuntu-with-nginx/).
