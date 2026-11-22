# Migrating On-Prem Apps to AWS: A Real Architecture Walkthrough

> A practical guide to migrating on-premises applications to AWS, covering a pre-migration assessment checklist, structuring migration waves, and the networking pitfalls that catch most teams off guard.

- Type: Post
- Published: 2025-04-18
- Tags: aws, cloud-architecture, networking
- Source: https://irfanadziri.dev/posts/migrating-on-prem-apps-to-aws/

---

Most migration guides stop at “lift and shift vs. re-architect.” This one skips the theory and focuses on the decisions to make before, during, and after moving workloads from an on-premises data centre to AWS.

---

## 1. Pre-Migration Assessment Checklist

Before touching a single EC2 instance, a clear inventory of what is being moved and why is needed. Skipping this phase is the single most common reason migrations stall mid-flight.

### Application Discovery

- **Dependency mapping** - Use AWS Application Discovery Service (ADS) or run `netstat`/`ss` on each host to capture live network connections. Document every upstream and downstream dependency, including internal APIs, shared file systems, and databases.
- **Runtime & OS versions** - Note OS version, kernel, runtime (Java version, .NET framework, Node, etc.), and any EOL software. AWS may not have a matching managed service or AMI.
- **Stateful vs. stateless** - Stateless apps (APIs, workers) are easiest to migrate first. Apps with local disk state (session files, temp uploads) need refactoring or a shared store before moving.
- **Licensing** - SQL Server, Oracle, Windows Server, and BYOL software have specific AWS licensing rules. Some licenses are tied to physical cores and do not translate to vCPUs cleanly.

### Infrastructure & Performance Baseline

- Capture 2–4 weeks of CPU, memory, disk I/O, and network throughput metrics. Right-sizing an EC2 instance is impossible without a real baseline - AWS Compute Optimizer needs CloudWatch data to give useful recommendations.
- Document peak load times. The migration window should avoid them.
- Note any hardware-specific requirements: GPUs, HSMs, FPGA, or high-frequency trading latency constraints that need Dedicated Hosts or bare metal instances.

### Data & Compliance

- Identify all data stores: RDBMS, file shares (NFS/CIFS/SMB), object stores, message queues, LDAP/AD directories.
- Classify data sensitivity (PII, PHI, financial). This determines which AWS regions can be used, encryption requirements, and whether AWS GovCloud applies.
- Check regulatory obligations: GDPR data residency, HIPAA BAA requirements, PCI-DSS scope. These constrain the VPC design and logging requirements before starting out.
- Confirm backup RPO/RTO targets. AWS Backup and DRS (Disaster Recovery Service) can meet most targets, but they need to be configured before cutover, not after.

### Readiness Score

After the checklist, assign each application a migration readiness score across four axes:

| Axis               | Questions to answer                                                            |
| ------------------ | ------------------------------------------------------------------------------ |
| **Complexity**     | Number of dependencies, custom kernel modules, legacy protocols (IPX, NetBIOS) |
| **Risk**           | Revenue impact of downtime, regulatory exposure                                |
| **Effort**         | Code changes needed, team familiarity with AWS                                 |
| **Business value** | Cost savings, performance gains, agility unlocked                              |

Low complexity + high business value apps go in Phase 1. High risk + high effort apps go last, or get a parallel-run strategy.

---

## 2. Migration Phases

Trying to migrate everything at once is how projects fail. Phasing builds confidence and institutional knowledge before touching critical systems.

### Phase 0 - Foundation (Weeks 1–4)

This phase has no application migrations. It is purely infrastructure setup.

- **Landing Zone** - Deploy AWS Control Tower (or a manually configured multi-account structure) with separate accounts for production, staging, and shared services. A flat single-account setup will cause pain at scale.
- **Network backbone** - Set up AWS Transit Gateway to connect the VPCs and on-premises network over AWS Direct Connect or Site-to-Site VPN. Get routing working before apps depend on it.
- **Identity** - Federate the on-premises Active Directory to AWS IAM Identity Center. Engineers should not be using long-lived IAM user keys.
- **Baseline security** - Enable AWS Config, GuardDuty, Security Hub, and CloudTrail in every account. These should be running before the first workload arrives.
- **CI/CD pipelines** - At minimum, have a working CodePipeline or GitHub Actions workflow that can deploy to EC2 or ECS. Migrating manually and then automating later doubles the work.

### Phase 1 - Low-Risk Workloads (Weeks 5–10)

Target: stateless, non-customer-facing, or non-critical applications.

Good candidates: internal tools, batch processing jobs, dev/staging environments, monitoring agents, log shippers, internal wikis.

Goal at this phase is operational learning - the team is figuring out CloudWatch alarms, IAM policies, security group rules, and deployment patterns. Mistakes here have low blast radius.

**Pattern:** Rehost (lift-and-shift) using AWS MGN (Application Migration Service). MGN installs an agent on the source server, continuously replicates the disk to a staging area in AWS, and then it launches a test instance before cutover. Cutover time is typically under 30 minutes.

### Phase 2 - Tier-2 Production (Weeks 11–20)

Target: production workloads that are important but not the most revenue-critical.

Good candidates: internal APIs, secondary databases, background workers, reporting services.

At this phase, start introducing managed services where it makes sense:

- Swap self-managed MySQL/PostgreSQL for RDS (Multi-AZ for production).
- Move file shares to Amazon EFS or FSx for Windows File Server.
- Replace on-prem Redis with ElastiCache.

**Important:** Do not re-architect and migrate at the same time. If swapping MySQL for Aurora, migrate first (rehost), stabilise, then re-platform in a subsequent sprint. Combining both changes makes rollback nearly impossible.

### Phase 3 - Tier-1 / Mission-Critical (Weeks 21–30+)

Target: the systems that would wake up the CTO at 3am if they went down.

These require a parallel-run or blue/green strategy:

1. Replicate the database to AWS using AWS DMS (Database Migration Service) with ongoing replication enabled.
2. Stand up the application in AWS, pointed at the replicated database.
3. Route a small percentage of traffic to the AWS environment (Route 53 weighted routing or ALB canary rules).
4. Monitor error rates, latency, and database lag for at least one full business cycle (usually a week).
5. Shift 100% of traffic, then stop replication, then decommission the on-prem instance.

Rollback is straightforward as long as replication is running - flip the DNS weight back. Once replication stops, rollback becomes a restore-from-backup operation.

### Phase 4 - Decommission & Optimise

After all workloads are in AWS, decommission on-prem hardware on a defined schedule. Do not keep on-prem “just in case” indefinitely - it creates an implicit expectation of rollback that team will be tempted to invoke for bad reasons.

Once decommissioned, revisit right-sizing with real AWS Cost Explorer data, move suitable workloads to Savings Plans or Reserved Instances, and evaluate which services warrant re-architecting (Lambda, containers, serverless databases).

---

## 3. Networking Pitfalls

Networking is where most migrations accumulate unplanned work. These are the issues that come up repeatedly.

### Overlapping CIDR Blocks

The most preventable problem. If the on-prem network uses `10.0.0.0/8` and then engineers created a VPC with `10.0.0.0/16`, VPC peering and Transit Gateway routing will break with no error - traffic will simply route to the wrong destination.

**Fix:** Audit all RFC 1918 ranges in use before creating a single VPC. Reserve a dedicated non-overlapping CIDR range for AWS (e.g., `172.16.0.0/12` if on-prem owns all of `10.x.x.x`). Plan for future VPCs - a `/16` per VPC with a `/8` supernet reserved for AWS is a reasonable starting point.

### Security Groups Are Not Firewalls

On-premises teams are used to perimeter firewalls with stateful rules, IP allowlists, and explicit deny rules. Security groups are stateful but **allow-only** - there is no explicit deny rule. Network ACLs add stateless deny capability but are easy to misconfigure because they are evaluated in order by rule number.

The common mistake: migrating a firewall ruleset literally into security groups, including rules like “deny all from 0.0.0.0/0.” That rule does nothing in a security group - the default deny is implicit and cannot be overridden by adding an explicit deny entry.

**Fix:** Model security groups around application tiers (web, app, db) and allow only the specific ports each tier needs from the tier that calls it. Reference security group IDs instead of IPs wherever possible - this survives instance replacement and Auto Scaling.

### DNS Resolution Between On-Prem and VPC

Applications that resolve hostnames using on-prem DNS servers will break when migrated to a VPC, because the VPC’s Route 53 Resolver handles `.aws.internal` hostnames, and the on-prem DNS has no knowledge of them. The reverse is also true: on-prem DNS cannot resolve Route 53 private hosted zone records.

**Fix:** Configure Route 53 Resolver inbound and outbound endpoints. Outbound endpoints forward queries for on-prem domains to on-prem DNS. Inbound endpoints let on-prem DNS forward queries for AWS private zones to Route 53. This bidirectional setup is required before any split-DNS app can function correctly after migration.

### NAT Gateway Costs Surprising Teams

On-premises, east-west traffic between application tiers is free. In AWS, traffic that routes out through a NAT Gateway (e.g., a private subnet instance calling an S3 bucket via the public endpoint) incurs NAT Gateway data processing charges in addition to the data transfer charge. At scale this adds up quickly and is completely avoidable.

**Fix:** Use VPC endpoints (Gateway endpoints for S3 and DynamoDB are free; Interface endpoints for other services have an hourly charge but eliminate NAT costs at volume). Audit NAT Gateway bytes-processed CloudWatch metric after Phase 1 to catch unexpected traffic patterns before they become a surprise on the bill.

---

## Closing Thoughts

The technical work of a migration is generally straightforward. The hard parts are the organisational ones: getting accurate dependency data, aligning on a cutover window with multiple stakeholders, and resisting the pressure to migrate everything at once to “get it done.”

Phase exist to create checkpoints. Each completed phase gives real operational experience in AWS, a reduced on-prem footprint, and a smaller blast radius for the next one. Move methodically, instrument everything from day one, and treat the decommission date as a hard deadline - not a goal that shifts indefinitely to the right.

### Further Reading

- [AWS Migration Hub](https://aws.amazon.com/migration-hub/) - Central tracking for application migrations
- [AWS Application Migration Service (MGN)](https://aws.amazon.com/application-migration-service/) - Agent-based rehost migrations
- [AWS Database Migration Service](https://aws.amazon.com/dms/) - Live database replication and cutover
- [Route 53 Resolver documentation](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html) - Hybrid DNS setup reference
- [AWS Well-Architected Migration Lens](https://docs.aws.amazon.com/wellarchitected/latest/migration-lens/migration-lens.html) - AWS’s own framework for evaluating migration readiness
