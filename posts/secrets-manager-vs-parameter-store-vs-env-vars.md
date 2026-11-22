# AWS Secrets Manager vs Parameter Store vs Environment Variables: When to Use Which

> A practical guide to choosing between environment variables, SSM Parameter Store, and AWS Secrets Manager, covering cost, rotation, audit, and the cases where each one is the wrong tool.

- Type: Post
- Published: 2026-01-26
- Tags: aws, security
- Source: https://irfanadziri.dev/posts/secrets-manager-vs-parameter-store-vs-env-vars/

---

Not every secret belongs in Secrets Manager, and not every config value belongs in an environment variable. The three options (environment variables, SSM Parameter Store, and AWS Secrets Manager) sit at different points on a spectrum of cost, operational overhead, and capability. Picking the wrong one either costs more than necessary or leaves a gap in rotation and audit that becomes a compliance problem later.

---

## Environment Variables

Environment variables are the path of least resistance. They’re supported everywhere: Lambda, ECS, EC2, containers, and local dev; which require no AWS setup. For non-sensitive configuration like port numbers, feature flags, log levels, or region identifiers, they’re often the right call.

The problem starts when teams use them for secrets. Environment variables have several failure modes that make them unsuitable for sensitive values:

- **Console visibility** - Lambda and ECS environment variables are visible in plain text in the AWS Console to anyone with read access to the resource
- **Log leakage** - stack traces, debug output, and misconfigured loggers regularly print environment variables to CloudWatch
- **Process inspection** - on EC2, any user with access to `/proc` can read environment variables of running processes
- **No rotation** - changing a secret means redeploying the application, which creates a window between detection and remediation during incidents
- **No audit trail** - there’s no record of who read the value or when

### When Environment Variables Are the Right Choice

- Non-sensitive runtime config: `PORT=8080`, `LOG_LEVEL=info`, `AWS_REGION=ap-southeast-5`
- Local development, where values in a `.env` file (never committed) are acceptable
- Feature flags that carry no security consequence if exposed

If the value would cause harm if leaked (a database password, an API key, a private certificate), then it does not belong in an environment variable.

---

## SSM Parameter Store

SSM Parameter Store is a key-value store with two tiers and two value types.

**Tiers:**

- **Standard** - free, up to 10,000 parameters, max 4 KB per value
- **Advanced** - paid per 10,000 API calls, up to 100,000 parameters, 8 KB per value, supports parameter policies (expiry, notification)

**Value types:**

- **String** - plain text, unencrypted
- **StringList** - comma-separated plain text values
- **SecureString** - encrypted with KMS (uses `aws/ssm` key by default, or a customer-managed key)

The hierarchical naming convention is Parameter Store’s most useful feature for managing config across environments:

```
/myapp/production/db-password
/myapp/production/api-key
/myapp/staging/db-password
/myapp/staging/api-key
```

IAM policies can grant access to an entire path prefix (`/myapp/production/*`), so a production Lambda only has access to production parameters. Access is logged in CloudTrail, giving an audit trail of who retrieved what and when.

### What Parameter Store Doesn’t Do

Parameter Store has no built-in secret rotation. A `SecureString` parameter is encrypted at rest and access-controlled, but nothing in AWS will automatically rotate it and update the downstream application. Rotation is a manual process or something you build yourself with a Lambda and a scheduled EventBridge rule.

Cross-account access is also limited. Parameter Store doesn’t support resource-based policies, so sharing a parameter with another AWS account requires IAM role assumption: workable, but not clean.

### When Parameter Store Is the Right Choice

- Per-environment configuration that needs central management: database hostnames, queue URLs, feature flag values, internal endpoints
- Secrets that are sensitive but don’t need automatic rotation: an API key that rarely changes, a third-party service token that you rotate manually on a known schedule
- High-volume secret reads where cost matters: Parameter Store Standard is free; Secrets Manager charges per secret per month regardless of read volume
- Teams with a low secret count who want central management without paying for Secrets Manager

---

## AWS Secrets Manager

Secrets Manager is purpose-built for secrets that need to rotate. The core capability that distinguishes it from Parameter Store is automatic rotation: Secrets Manager can invoke a Lambda function on a schedule to generate a new secret value, update the downstream resource (an RDS database, a Redshift cluster, a Documentdb instance), and swap the active version, all without application downtime, using staging labels (`AWSCURRENT`, `AWSPENDING`, `AWSPREVIOUS`) to manage the transition.

AWS provides managed rotation Lambda functions for several services out of the box: RDS MySQL, RDS PostgreSQL, RDS Oracle, RDS SQL Server, Amazon Redshift, and Amazon DocumentDB. For other secret types, you write a custom rotation Lambda.

**Cost:**

- $0.40 per secret per month
- $0.05 per 10,000 API calls

Ten secrets cost $4/month before API call charges. At scale (hundreds of secrets), this adds up. For secrets that genuinely need rotation, it’s worth it. For static config values that rarely change, it’s waste.

### Cross-Account Access

Unlike Parameter Store, Secrets Manager supports resource-based policies. A secret in Account A can grant access directly to a role in Account B without the consuming account needing to assume a role across the boundary first. This makes Secrets Manager the cleaner option when secrets need to be shared across AWS accounts.

### Versioning

Every update to a secret creates a new version. Secrets Manager tracks versions with staging labels:

- `AWSCURRENT` - the version currently in use
- `AWSPENDING` - the version being rotated in (during rotation)
- `AWSPREVIOUS` - the last active version, retained for rollback

Applications that retrieve the secret by name always get `AWSCURRENT`. If rotation produces a bad value, the previous version is still available.

### When Secrets Manager Is the Right Choice

- Database credentials on RDS, Redshift, or DocumentDB: the managed rotation integration is the primary reason Secrets Manager exists
- Any secret with a compliance requirement for automatic rotation (PCI-DSS, SOC 2, ISO 27001 all ask about rotation)
- Secrets shared across multiple AWS accounts via resource-based policies
- API keys or tokens that must rotate on a defined schedule without manual intervention

---

## Side-by-Side Comparison

| Dimension                 | Environment Variables           | Parameter Store (SecureString)       | Secrets Manager                         |
| ------------------------- | ------------------------------- | ------------------------------------ | --------------------------------------- |
| **Cost**                  | Free                            | Free (Standard tier)                 | $0.40/secret/month + API calls          |
| **Encryption at rest**    | No                              | Yes (KMS)                            | Yes (KMS)                               |
| **Audit trail**           | No                              | CloudTrail                           | CloudTrail                              |
| **Automatic rotation**    | No                              | No                                   | Yes (built-in for RDS, custom Lambda)   |
| **Versioning**            | No                              | No (Advanced tier: parameter policy) | Yes (AWSCURRENT/AWSPENDING/AWSPREVIOUS) |
| **Cross-account sharing** | N/A                             | Role assumption only                 | Resource-based policy                   |
| **Console visibility**    | Plain text                      | Masked (SecureString)                | Masked                                  |
| **Right for**             | Non-sensitive config, local dev | Static secrets, per-env config       | Rotating credentials, compliance        |

---

## Decision Framework

**Does the value contain anything sensitive (password, token, key)?**

- No → environment variable or Parameter Store String. Done.
- Yes → continue.

**Does it need to rotate automatically?**

- Yes → Secrets Manager.
- No → continue.

**Does it need to be shared across AWS accounts?**

- Yes → Secrets Manager (resource-based policy).
- No → continue.

**How many secrets, and how often are they read?**

- Few secrets, low read volume → either works; Secrets Manager if budget allows.
- Many secrets or high read volume → Parameter Store SecureString (free tier, no per-secret charge).

**Is there a compliance requirement for rotation audit?**

- Yes → Secrets Manager.
- No → Parameter Store SecureString is sufficient.

---

## A Common Mistake

Storing database passwords as Lambda environment variables is the most common mistake. It works until the password needs to change, then it’s a redeployment. It works until someone with Lambda console access reads the value. It works until a misconfigured logger writes the environment to CloudWatch.

Database credentials belong in Secrets Manager if they need to rotate, or Parameter Store SecureString if rotation is manual and infrequent. The Lambda retrieves the secret at runtime via the SDK, not from an environment variable. The cost is a few hundred milliseconds on cold start, which is almost always worth the trade.

---

## Closing Thoughts

The practical split: environment variables for non-sensitive config, Parameter Store SecureString for sensitive values that don’t rotate, Secrets Manager for credentials that must rotate or cross account boundaries. The upgrade path is one-way: once compliance asks for rotation audit trails, Parameter Store can’t retrofit that. Starting with Secrets Manager for database credentials from the beginning avoids that migration later.

---

### Further Reading

- [AWS Secrets Manager pricing](https://aws.amazon.com/secrets-manager/pricing/) - current per-secret and API call rates by region
- [SSM Parameter Store pricing](https://aws.amazon.com/systems-manager/pricing/) - Standard vs Advanced tier limits and costs
- [Secrets Manager rotation for RDS](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets-rds.html) - how the managed rotation Lambda works for RDS engines
- [Using Parameter Store parameters in Lambda](https://docs.aws.amazon.com/systems-manager/latest/userguide/ps-integration-lambda-extensions.html) - the Lambda extension that caches Parameter Store values locally to reduce API call volume
