# The same thin stack, poured three times

> Thin, versioned Terraform stacks consuming shared reference-architecture modules to run three internal application platforms on ECS Fargate with RDS PostgreSQL 17 behind RDS Proxy.

- Type: Case study
- Role: Infrastructure engineer
- Period: May 2025 → Jun 2026
- Employer: a global automotive manufacturer
- Stack: terraform, aws, ecs fargate, rds postgresql, rds proxy, ssm parameter store, github actions, checkov
- Source: https://irfanadziri.dev/work/enterprise-app-platform-iac/

---

Three different applications, three different teams, three different problems to solve, and the same infrastructure decision made three times over, for a global automotive manufacturer’s internal application platforms. Each time, the choice was the same: don’t hand-roll the AWS resources, consume a versioned internal reference-architecture module and keep the application’s own stack as thin as possible. It’s the same discipline applied to a request/order workflow app, an internal data-processing platform, and an import/reporting platform, and the fact that it holds up identically across three unrelated teams is the actual proof it’s the right shape.

## Thin stacks, shared modules

None of these three repositories declares a raw ECS service resource or a hand-rolled VPC. Each one is a small set of files (a root module, a secrets file, per-environment tfvars) that composes a pinned, versioned internal container module and drives it entirely through variables. Shared landing-zone facts (the VPC id, the ALB listener ARN, the ALB’s security group, the Route 53 zone, the DB subnet group, the NLB ARN) are resolved at plan time from SSM Parameter Store rather than hardcoded, so the same stack definition is portable across accounts and environments without anyone hand-editing an identifier. Environment separation is directory-based: a nonprod/prod split, each with its own tfvars and its own remote state key in a shared S3 backend.

## ECS Fargate and a real database lifecycle

Compute across all three platforms is containerized services behind a shared Application Load Balancer, routed by host or path rules to per-service target groups with their own health checks. The data layer in every case is Amazon RDS for PostgreSQL, fronted by an RDS Proxy for pooled and intranet access. That’s where the work stopped being “write the Terraform once and walk away.” Over the life of these stacks I drove a real PostgreSQL major-version upgrade to 17 across multiple environments, changed storage type and sizing to stop drift caused by manual tuning, enforced SSL on every connection, and tuned backup retention and maintenance windows. None of that is glamorous, but a database that’s been upgraded, resized, and hardened in place is a different asset than one that was provisioned once and left alone.

## Secrets by reference, drift by design

Every application secret in all three stacks is provisioned in Secrets Manager and injected into containers by reference. Nothing sensitive lives in tfvars, only identifiers. A recurring piece of the work was closing the gap between that intent and what Terraform actually tracked: duplicated container environment variables and mis-indexed secret references caused plan drift often enough that eliminating them became a standing habit, not a one-time cleanup.

The more interesting drift wasn’t a mistake. It was structural. One of the three platforms deploys through a container pipeline that registers new task-definition revisions outside of Terraform entirely, and production database attributes get touched manually between applies. That means a clean plan on the source-of-truth branch was never actually achievable, because the live state diverges from the code by design, not by accident. Rather than fight that with a targeted apply (which the platform’s CI/CD deliberately doesn’t support) or ignore the plan output altogether, I wrote a drift assessment that triaged every planned change into three buckets: safe to let happen, must be re-asserted immediately after apply, or purely cosmetic. I verified the real IAM boundaries by making the actual API calls rather than reading the policy and hoping, and used that as the basis for applying with confidence instead of applying blind. It’s a small piece of process, but it’s the difference between “the plan output is scary so nobody runs apply” and “we know exactly which lines in this plan are expected and why.”

**As built: one thin stack's runtime, drift path included.** aws account: per environment contains shared alb: oidc listener rules; ecs services: reference-arch module; rds postgresql 17 + rds proxy; secrets manager + kms. thin versioned stack: tfvars per env → shared alb: oidc listener rules (plan / apply). thin versioned stack: tfvars per env → ecs services: reference-arch module (plan / apply). thin versioned stack: tfvars per env → rds postgresql 17 + rds proxy (plan / apply). thin versioned stack: tfvars per env → secrets manager + kms (plan / apply). shared alb: oidc listener rules → ecs services: reference-arch module. ecs services: reference-arch module → rds postgresql 17 + rds proxy. ecs services: reference-arch module → secrets manager + kms. container pipeline: task-def revisions outside terraform connects loosely to ecs services: reference-arch module (drift by design).

## Security gates that run before the apply, not after

CI/CD for all three platforms is manual dispatch with a plan/apply choice, gated by a mandatory static-analysis scan that has to pass before the shared reusable Terraform pipeline runs. Production applies are restricted to the main branch by environment protection rules. It’s a deliberately unglamorous pipeline shape, with no auto-apply and no push-triggered production changes, because a manually dispatched run with a human choosing “plan” or “plan and apply” is a much smaller blast radius than a merge queue quietly applying to production.

**As built: the dispatch-gated pipeline every stack runs through.** engineer, dispatch: plan / plan+apply → static-analysis gate. static-analysis gate → shared terraform pipeline (pass). shared terraform pipeline → s3 remote state. shared terraform pipeline → deployment role. deployment role → ssm parameter store: shared landing-zone facts. shared terraform pipeline → versioned reference-architecture module.

## What this wasn’t

These weren’t platforms I designed. The shape of each one comes from an internal reference-architecture module that someone else owns, and the applications belong to three different teams. My part was keeping each application’s own stack thin on top of that module, then the work that came after: the PostgreSQL upgrade and hardening, the secrets clean-up, and the drift assessment.

## What I’d change

The reference-architecture module these three stacks consume doesn’t expose a way to ignore changes on the ECS task definition, which is the actual root cause of the structural drift above. The module could absorb that instead of every consuming stack needing its own drift-assessment workaround. I’d rather fix it once at the module layer than keep writing triage documents for a problem the module could just not have. It’s on the list; it just isn’t mine to ship alone.
