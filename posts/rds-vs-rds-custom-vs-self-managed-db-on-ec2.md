# Amazon RDS vs RDS Custom vs Self-Managed Database on EC2: Choosing the Right Control Boundary

> A practical breakdown of the three database deployment models on AWS (fully managed RDS, semi-managed RDS Custom, and self-managed on EC2), covering what each one costs in control, operational burden, and money.

- Type: Post
- Published: 2026-02-25
- Tags: aws, cloud-architecture
- Source: https://irfanadziri.dev/posts/rds-vs-rds-custom-vs-self-managed-db-on-ec2/

---

Every database deployment on AWS involves a trade-off between how much AWS manages and how much control customers retain. The three options (Amazon RDS, RDS Custom, and a self-managed database on EC2) represent three distinct positions on that spectrum. Picking the wrong one either leaves customer paying for management they didn’t need or fighting AWS automation for access they should have had from the start.

This writeup is about understanding where the control boundary sits in each model, and which workloads belong in each one.

---

## The Control Spectrum

Before comparing options, it helps to be precise about what “control” means in this context. There are roughly five layers where it matters:

| Layer                | What it covers                                                   |
| -------------------- | ---------------------------------------------------------------- |
| **OS**               | Patching, kernel parameters, OS-level tuning, direct SSH         |
| **Database binary**  | Engine version, patch application, custom builds                 |
| **Database config**  | `pg_hba.conf`, `my.cnf`, init scripts, extensions, plugins       |
| **Storage**          | Disk type, filesystem, I/O scheduler, direct volume access       |
| **HA & replication** | Failover mechanism, replica topology, replication lag visibility |

Amazon RDS controls all five on customer’s behalf. RDS Custom gives customer access to OS and some database binary layers while AWS still manages infrastructure. Self-managed EC2 gives them all five but makes them responsible for all five.

---

## Amazon RDS

RDS is a fully managed relational database service. AWS handles provisioning, OS patching, database engine patching, backups, Multi-AZ failover, and read replica management. User interact with the database through its endpoint. There is no SSH, no OS shell, no direct filesystem access.

### What Customer Get

- **Automated backups** with point-in-time recovery up to 35 days
- **Multi-AZ deployments** with automatic failover (typically under 60 seconds for most engines)
- **Read replicas** (up to 15 for Aurora, 5 for standard RDS engines)
- **Storage autoscaling** that grows the volume automatically when free space drops below a threshold
- **Parameter groups** for database-level configuration (equivalent to editing `my.cnf` or `postgresql.conf`, but through the AWS API)
- **Option groups** for adding features like Oracle TDE or SQL Server native backup

### What They Give Up

They cannot:

- SSH into the underlying EC2 instance
- Install OS packages or custom monitoring agents at the OS level
- Apply database patches on own schedule (minor patches can be deferred; major versions require a manual upgrade)
- Use database features that require OS-level access (e.g., `LOAD DATA INFILE` from a local path, custom tablespace directories on specific mount points)
- Access the transaction log files directly (customers get logical replication slots, but not raw WAL files on disk)

### Supported Engines

MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, and Amazon Aurora (MySQL-compatible and PostgreSQL-compatible). The exact feature set varies by engine. Oracle and SQL Server have the most restrictions because of licensing constraints.

### When RDS Is the Right Choice

- Customer workload uses a standard engine configuration without custom OS-level requirements
- The team does not have dedicated database administrators who need low-level access
- Customers want automated patching, backups, and failover without building the tooling yourself
- Customers are running a SaaS product where operational simplicity at scale matters more than tuning flexibility

RDS is the correct default for most production workloads. The managed overhead it removes (patch cycles, backup validation, failover testing) is genuinely expensive to replicate yourself.

---

## RDS Custom

RDS Custom sits between fully managed RDS and self-managed EC2. It gives customers SSH access to the underlying EC2 instance and direct access to the database binary and OS, while AWS still manages the infrastructure primitives (networking, storage, backups at the snapshot level).

RDS Custom currently supports Oracle and SQL Server. It exists specifically for those engines because enterprise Oracle and SQL Server deployments frequently require OS-level customisation that standard RDS does not permit.

### What Customers Get (Beyond Standard RDS)

- **SSH access** to the underlying EC2 instance via AWS Systems Manager (SSM)
- **OS-level access** to install agents, modify OS parameters, and run OS-level scripts
- **Database binary access** to apply custom Oracle patches and configure Oracle options that require OS interaction (Oracle Database Vault, Transparent Data Encryption with custom keystores)
- **Custom database configurations** that require editing files directly on disk rather than through parameter groups
- **Shared responsibility for patching**: they own OS and database patch application, while AWS still manages the underlying EC2 host and EBS volumes

### The Automation Boundary

RDS Custom introduces the concept of a **pause automation** window. If engineer make changes to the instance that AWS automation does not expect (restarting the database manually, modifying system files), they first pause RDS Custom automation, make the changes, then resume automation. If they skip this step, AWS automation may detect the unexpected state and attempt to remediate it, potentially undoing the changes.

This is the key operational difference from standard RDS: engineers are not fully shielded from the infrastructure layer, which means they can break things that RDS would have protected them from.

### When RDS Custom Is the Right Choice

- Customer are running **Oracle Database** and need features that require OS access: Oracle GoldenGate, custom keystore configurations, specific Oracle patches not yet available in standard RDS
- Customer are running **SQL Server** with requirements for custom CLR assemblies, linked server configurations that depend on OS-level authentication, or custom SQL Server Agent jobs that interact with the OS
- Engineers are migrating an existing on-premises Oracle or SQL Server installation to AWS and cannot refactor it to work within standard RDS constraints

If customers are not running Oracle or SQL Server, RDS Custom is not available to them, and for MySQL and PostgreSQL workloads, the combination of standard RDS parameter groups and extensions covers the vast majority of production requirements.

---

## Self-Managed Database on EC2

Running own database engine on an EC2 instance gives engineer complete control over every layer. They choose the OS, the engine version, the build flags, the storage configuration, the replication topology, and the backup strategy. They also own every failure.

### What Customer Get

- **Full OS access**: any Linux distribution, any kernel, any OS-level tuning
- **Any engine version**, including versions AWS does not support in RDS, custom builds, or engines RDS does not offer (CockroachDB, YugabyteDB, TiDB, Cassandra, etc.)
- **Direct storage access**: choose between `io2` block express, `gp3` with custom IOPS and throughput, or instance store NVMe for the highest I/O performance
- **Custom replication topologies**: Patroni for PostgreSQL HA, Orchestrator for MySQL, custom read replica fanout configurations
- **No managed service overhead**: no RDS licensing premium on top of instance costs

### What Customer Own

Everything RDS handles automatically becomes customer’s operational responsibility:

- **OS patching**: engineers schedule, test, and apply kernel and package updates
- **Database patching**: engineers track CVEs, download patches, test in staging, and apply them in production
- **Backups**: engineers build or configure the backup pipeline (pg_dump, xtrabackup, filesystem snapshots via EBS)
- **Point-in-time recovery**: WAL archiving to S3 with a tool like pgBackRest or WAL-G if engineers want PITR; otherwise they recover to the last snapshot
- **High availability**: engineers deploy and operate Patroni, Pacemaker, or a similar HA solution; they handle split-brain scenarios
- **Failover automation**: Route 53 health checks and DNS failover, or a cluster manager that updates the application connection string
- **Storage management**: monitoring disk usage, extending volumes, managing RAID if applicable
- **Monitoring**: CloudWatch agent, Prometheus exporters, pg_stat_statements, and slow query logs, all configured manually

### Storage Considerations

The storage choice matters significantly for a self-managed database. `io2` Block Express gives customers up to 256,000 IOPS and 4,000 MB/s throughput per volume, which exceeds what any current RDS instance can deliver. For write-heavy OLTP workloads that have saturated RDS storage performance, this is the primary technical reason to consider self-managed EC2.

Instance store (NVMe SSD physically attached to the host) delivers the highest IOPS and lowest latency of any storage option in AWS, with no network path. The tradeoff is that instance store is ephemeral: data is lost if the instance stops or is terminated. Using instance store for a production database requires a robust replication strategy where the instance store is never the only copy of the data (typically: primary on instance store, synchronous replica on EBS, WAL streaming to S3).

### When Self-Managed EC2 Is the Right Choice

- Customers need a database engine that RDS does not support
- Customers need storage performance beyond what RDS offers (>80,000 IOPS, >2,000 MB/s throughput on a single instance)
- Customers have a database team with the expertise and capacity to own patching, HA, and recovery
- Customers have specific licensing requirements (BYOL with agreements tied to physical core counts, custom Oracle options not available in RDS Custom)
- Customers are running a stateful distributed database (Cassandra, ScyllaDB) where the cluster topology is application-managed rather than handled by AWS

Self-managed EC2 is not the right choice because “we want more control” in the abstract. The operational cost is real and recurring. Every hour spent on patching cycles, backup validation, and HA incident response is an hour not spent on the application.

---

## Side-by-Side Comparison

| Dimension           | RDS                                            | RDS Custom             | Self-Managed EC2 |
| ------------------- | ---------------------------------------------- | ---------------------- | ---------------- |
| OS access           | None                                           | Yes (SSM)              | Yes (SSH)        |
| Engine patching     | AWS-managed                                    | Shared                 | Customers        |
| OS patching         | AWS-managed                                    | Customers              | Customers        |
| Backup / PITR       | Automated                                      | Automated              | Customers        |
| Multi-AZ failover   | Automated                                      | Automated              | Customers        |
| Read replicas       | Managed                                        | Managed                | Customers        |
| Custom extensions   | Parameter groups only                          | Full access            | Full access      |
| Storage autoscaling | Yes                                            | Yes                    | Manual           |
| Supported engines   | MySQL, PG, MariaDB, Oracle, SQL Server, Aurora | Oracle, SQL Server     | Any              |
| Cost premium        | RDS markup on instance                         | RDS markup on instance | Raw EC2 price    |
| Operational burden  | Low                                            | Medium                 | High             |

---

## The Cost Reality

RDS charges a premium over raw EC2 pricing for the same instance family. For a `db.r6g.2xlarge` (8 vCPU, 64 GB RAM), the on-demand price in `ap-southeast-1` is roughly:

- **RDS (PostgreSQL, Multi-AZ):** ~~$0.96/hour (~~$691/month)
- **EC2 (r6g.2xlarge, on-demand):** ~~$0.404/hour (~~$291/month)

The gap narrows significantly with Reserved Instances. A 1-year no-upfront Reserved Instance for RDS cuts the price roughly in half, as does a 1-year Reserved Instance for EC2. At reserved pricing, the operational cost of self-managing often exceeds the savings unless the team already has the tooling built and the expertise in-house.

Aurora Serverless v2 changes the calculus for variable workloads. It scales in 0.5 ACU increments, which means customers pay for actual consumed capacity rather than a fixed instance size. For workloads with significant idle periods (dev/staging, overnight batch jobs, seasonal traffic), Aurora Serverless v2 can be materially cheaper than a fixed RDS instance.

---

## Decision Framework

Start with RDS unless customer have a specific reason not to. Then work through these questions:

**Is engine supported by RDS?**

- No → Self-managed EC2.
- Yes → Continue.

**Do customer need OS-level access or custom Oracle/SQL Server configurations?**

- Yes → RDS Custom (if Oracle or SQL Server), otherwise reconsider whether the requirement is real.
- No → Continue.

**Do customer need storage performance beyond RDS limits, or a replication topology RDS cannot provide?**

- Yes → Self-managed EC2, but budget for the operational overhead.
- No → RDS.

**Do customer have a dedicated DBA team with capacity to own patching, HA, and recovery tooling?**

- No → RDS, regardless of other preferences. Self-managed EC2 without DBA capacity becomes a liability.
- Yes → Any option is viable; let the technical requirements drive the choice.

The control boundary is not about preference. It is about which failure modes customer are equipped to handle and which ones customer would rather outsource.

### Further Reading

- [Amazon RDS documentation](https://docs.aws.amazon.com/rds/latest/userguide/) - Feature reference for all supported engines
- [RDS Custom documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-custom.html) - Supported engines, automation pause/resume, and shared responsibility model
- [pgBackRest](https://pgbackrest.org/) - WAL archiving and PITR for self-managed PostgreSQL
- [Patroni](https://patroni.readthedocs.io/) - HA solution for PostgreSQL on EC2
- [AWS Database Blog](https://aws.amazon.com/blogs/database/) - Engine-specific migration and tuning guides
