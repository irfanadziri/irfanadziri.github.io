# Terraform Remote State: S3 Only vs S3 + DynamoDB Locking

> A practical breakdown of Terraform remote state on AWS: when S3 alone is enough and when DynamoDB state locking is worth the added complexity.

- Type: Post
- Published: 2025-12-09
- Tags: aws, terraform
- Source: https://irfanadziri.dev/posts/terraform-remote-state-s3-dynamodb-locking/

---

> **Disclaimer:** This article reflects my own experience and setup. Your team size, pipeline structure, and risk tolerance will influence which approach fits best. Use this as a reference, not a prescription.

Terraform state is a single source of truth for your infrastructure. By default it lives in a local `terraform.tfstate` file, which works fine until two people run `terraform apply` at the same time and one of them overwrites the other’s changes with a stale state. Remote state on S3 solves the storage problem. DynamoDB locking solves the concurrency problem. They are separate concerns, and whether you need both depends on how your team works.

---

## What Remote State Actually Does

When you configure an S3 backend, Terraform reads the state file from S3 before planning and writes it back after applying. Every team member and every CI/CD pipeline works from the same state, so there’s no drift between what one person’s local file says and what actually exists in AWS.

```hcl
terraform {
  backend "s3" {
    bucket = "my-tfstate-bucket"
    key    = "project/terraform.tfstate"
    region = "ap-southeast-5"
  }
}
```

That’s the minimum. No DynamoDB, no locking - just shared state storage.

---

## S3 Only

### What You Get

- **Shared state** across all team members and pipelines - everyone reads and writes the same file
- **Versioning** - enable S3 versioning on the bucket and you get a full history of every state change, with the ability to roll back to a previous version manually
- **Encryption at rest** - enable SSE-S3 or SSE-KMS on the bucket; state files contain resource IDs, ARNs, and sometimes sensitive outputs, so this matters
- **Simple setup** - one S3 bucket, no other AWS resources required

### What You Give Up

- **No concurrency protection** - if two `terraform apply` runs start at the same time against the same state key, the second one reads stale state, plans against it, and writes back a conflicting result. The last write wins, and the first one’s changes may be silently lost or partially overwritten
- **No visibility into who holds state** - there’s no way to know if someone else is mid-apply before you start

### When S3 Only Is Enough

S3 alone is a reasonable choice when:

- You are the only person running Terraform against this state
- Your CI/CD pipeline serialises applies - only one pipeline job can run `terraform apply` at a time (e.g., a single GitHub Actions job with no parallel runs)
- The infrastructure is low-risk enough that a corrupted state is recoverable quickly from S3 version history

For solo projects, personal infrastructure, or tightly controlled pipelines, the DynamoDB table is overhead with no practical benefit.

---

## S3 + DynamoDB Locking

DynamoDB locking adds a distributed lock on top of S3 state. When Terraform starts an operation that modifies state (plan with `-out`, apply, destroy), it writes a lock entry to the DynamoDB table. Any other Terraform process that tries to acquire the same lock while it’s held gets an error:

```
Error: Error acquiring the state lock
Lock Info:
  ID:        a1b2c3d4-...
  Path:      project/terraform.tfstate
  Operation: OperationTypeApply
  Who:       irfan@hostname
  Version:   1.9.0
  Created:   2025-10-13 08:22:11
```

The lock is released when the operation completes. If a process crashes mid-apply and leaves a stale lock, it can be force-unlocked with `terraform force-unlock <lock-id>`.

### Configuration

```hcl
terraform {
  backend "s3" {
    bucket         = "my-tfstate-bucket"
    key            = "project/terraform.tfstate"
    region         = "ap-southeast-5"
    dynamodb_table = "terraform-state-lock"
  }
}
```

The DynamoDB table needs a single partition key named `LockID` of type `String`. Nothing else is required.

```hcl
resource "aws_dynamodb_table" "tf_state_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

`PAY_PER_REQUEST` is the right billing mode here. The table gets one write per apply and one delete when the lock is released - the traffic is negligible and provisioned capacity would be wasteful.

### What You Get

- **Concurrency protection** - two simultaneous applies against the same state key cannot both proceed; one will fail fast with a clear error rather than silently corrupting state
- **Audit trail** - the lock entry records who started the operation, on which machine, at what time, using which Terraform version
- **Safe for teams and parallel pipelines** - multiple engineers or multiple CI jobs can attempt applies without coordination; the lock serialises them automatically

### What You Give Up

- **One more AWS resource to manage** - the DynamoDB table itself needs to exist before `terraform init` can succeed against this backend, which creates a bootstrapping problem (more on this below)
- **Marginal cost** - negligible with PAY_PER_REQUEST, but non-zero
- **False safety for long-running applies** - the lock prevents concurrent applies but doesn’t prevent someone from force-unlocking a lock that’s legitimately held by a slow apply and then running their own apply on top of it

---

## The Bootstrapping Problem

Both the S3 bucket and the DynamoDB table must exist before you can run `terraform init` with this backend. You can’t use Terraform to create them in the same configuration that uses them as a backend - that’s a chicken-and-egg problem.

Common solutions:

- **Create them manually** via the AWS Console or CLI, then never touch them with Terraform
- **Use a separate bootstrap Terraform configuration** that has a local backend, creates the bucket and table, and is only ever run once

```bash
# Bootstrap the state infrastructure manually
aws s3api create-bucket \
  --bucket my-tfstate-bucket \
  --region ap-southeast-5 \
  --create-bucket-configuration LocationConstraint=ap-southeast-5

aws s3api put-bucket-versioning \
  --bucket my-tfstate-bucket \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-5
```

---

## Side-by-Side Comparison

| Dimension                      | S3 Only                             | S3 + DynamoDB                    |
| ------------------------------ | ----------------------------------- | -------------------------------- |
| **Concurrent apply safety**    | None                                | Full lock with error on conflict |
| **State history**              | Yes (with S3 versioning)            | Yes (with S3 versioning)         |
| **Who-is-applying visibility** | None                                | Yes, in lock entry               |
| **Setup complexity**           | One S3 bucket                       | S3 bucket + DynamoDB table       |
| **Cost**                       | S3 storage only (\~cents/month)     | S3 + DynamoDB (still negligible) |
| **Right for solo use**         | Yes                                 | Yes, but unnecessary             |
| **Right for teams**            | Only if pipeline serialises applies | Yes                              |
| **Bootstrapping required**     | S3 bucket only                      | S3 bucket + DynamoDB table       |

---

## Closing Thoughts

The decision comes down to one question: **can two Terraform applies against this state run at the same time?**

If the answer is no - solo project, serialised CI, single pipeline job - S3 alone is sufficient. Versioning handles recovery, and the DynamoDB table adds complexity without a practical benefit.

If the answer is yes or maybe - multiple engineers, parallel CI jobs, no pipeline-level serialisation - add DynamoDB. The cost is negligible, the setup is a one-time ten-minute job, and it prevents the kind of state corruption that is genuinely painful to recover from.

---

### Further Reading

- [Terraform S3 backend documentation](https://developer.hashicorp.com/terraform/language/backend/s3) - full reference for all backend configuration options including encryption, role assumption, and workspace key prefixes
- [Terraform state locking](https://developer.hashicorp.com/terraform/language/state/locking) - how locking works across different backends, and when `terraform force-unlock` is appropriate
- [S3 backend with DynamoDB locking - AWS blog](https://aws.amazon.com/blogs/aws/terraform-state-management-with-amazon-s3-and-amazon-dynamodb/) - AWS’s own walkthrough of the setup
