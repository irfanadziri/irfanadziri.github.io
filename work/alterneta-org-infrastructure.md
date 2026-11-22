# None of the apps, all of the infrastructure

> Sole infrastructure author for a small org whose app roadmap was shelved before launch. I built the ground the apps were meant to stand on: a shared 3-AZ VPC, an in-house Terraform module library, and OIDC-based GitHub Actions pipelines that have never held a stored AWS credential. Written, validated, and dry-run against a real account; no application ever deployed on it.

- Type: Case study
- Role: Sole infra author
- Period: Jun 2025 → Jul 2025
- Employer: Alterneta
- Stack: terraform, github actions, oidc, vpc, kms, s3 backend
- Source: https://irfanadziri.dev/work/alterneta-org-infrastructure/

---

Alterneta was going to run a handful of internal apps: an AI financial-analysis tool, a real estate management app, a marketing site, a few smaller experiments. It never got there. The org’s roadmap was shelved before any of them deployed. What did get built is the ground they were meant to stand on. Across the org’s repositories I’m the primary, in most cases the sole, author of the Terraform and the GitHub Actions pipelines that provision infrastructure, and I stayed out of the application codebases entirely, because there were no applications yet to be in. The title is literal: all of the infrastructure, none of the apps. Every piece here was written, validated, and dry-run against a real AWS account. None of it carries a live workload today, and that’s the honest status: a floor built and proven, waiting on an app team that hasn’t come.

## Building the floor before the apps needed it

The first piece was a shared sandbox VPC: three availability zones, a clean /16 split into public and private halves, NAT gateway creation exposed as a variable and left off by default, because a sandbox environment doesn’t need three NAT gateways billing around the clock. When the first application’s compute stack came to be written, it didn’t get its own network. It reached into the sandbox VPC’s outputs and built on top of that. That’s the shared-VPC pattern this org is built on, and the reasoning behind it (plus the dependency-cycle bug that came from briefly getting it wrong) is its own story told elsewhere in this set. The short version is that “one VPC per app” didn’t survive contact with a second application stack, even before a single app went live.

## The application’s security layer, in four small modules

On top of that shared network, I authored the compute stack the AI financial-analysis tool was meant to run on. Rather than one monolithic file, it’s four composable modules: a KMS key with rotation enabled for EBS encryption, an IAM assumable role and instance profile scoped to what the instance actually needs, a security group that allows SSH only from the VPC’s own CIDR, and a launch template wiring all three together. It’s deliberately unglamorous infrastructure, a single EC2 instance and not a fleet, and no application code ever shipped onto it. But the identity and encryption layer around it is built the way I’d want it if an app ever did land and grow, because retrofitting KMS and least-privilege IAM onto a running instance is a worse afternoon than doing it up front.

**As built: the app compute stack on the shared sandbox vpc.** shared sandbox vpc: 3 az, public / private split contains security group: ssh from vpc cidr only; launch template; ec2 instance; encrypted gp3 root volume. launch template → ec2 instance (launches). security group: ssh from vpc cidr only → ec2 instance (attached). iam role + instance profile → ec2 instance (attached). ec2 instance → encrypted gp3 root volume. kms key: rotation enabled connects loosely to encrypted gp3 root volume (encrypts).

## Pipelines that never see a credential

Every infra repo in the org calls into two reusable GitHub Actions workflows instead of duplicating pipeline logic: one for `terraform plan`, one for `terraform apply`. Both assume an AWS IAM role through GitHub’s OIDC provider, with `id-token: write` and nothing else, and no stored access keys anywhere in the org. Plan runs automatically on every pull request; apply is a deliberate `workflow_dispatch`, never a push trigger. The organization owns how Terraform runs; each infra repo only owns what it runs against. Getting the OIDC role and permissions wired correctly took a few iterations. A couple of path and permission fixes landed before the pipeline stabilized, which is normal for the first time you wire OIDC into a new AWS account, not a sign anything was wrong with the approach.

**As built: module library, reusable workflows, and the oidc trust path.** shared public repos contains terraform module library; reusable workflows: plan / apply. private infra repos contains network stack: shared vpc; app stack: ec2 · kms · iam. reusable workflows: plan / apply → network stack: shared vpc (workflow_call). reusable workflows: plan / apply → app stack: ec2 · kms · iam (workflow_call). terraform module library → network stack: shared vpc (git source, ref-pinned). network stack: shared vpc → app stack: ec2 · kms · iam (vpc outputs). network stack: shared vpc → aws iam role: no stored keys (assumes via oidc). app stack: ec2 · kms · iam → aws iam role: no stored keys (assumes via oidc).

## Moving off the registry, on purpose

The org’s Terraform started on third-party registry modules, because that’s the fastest way to get a working VPC or security group. It’s moving away from them now: the reusable module library other infra repos are meant to consume is a hand-rolled VPC module with dynamic, object-typed ingress and egress rules, published for git-source consumption so a repo can pin a specific ref instead of copying a file. It’s a small org, so this isn’t urgent, but every dependency on a registry module is a dependency on someone else’s release cadence, and I’d rather the org’s core network primitive be something I can change on a Tuesday.

## What this wasn’t

It wasn’t a production platform. The org’s roadmap was shelved before any of the apps deployed, so nothing here carries a live workload: every piece was written, validated and dry-run against a real AWS account, and then it waited. It also wasn’t application work. I stayed out of the application codebases entirely, because there were no applications yet to be in.

## What I’d change

State for every repo in this org lives in one S3 bucket with no DynamoDB lock table, and there’s no Terraform workspace or environment split beyond a single `dev`/`sandbox` tag. That’s fine while I’m the only person running `apply`, and both of those stop being fine the moment a second engineer or a second pipeline touches the same state key. Neither is a hard problem; both are on the list specifically because they’re easy to fix now and expensive to fix after something actually collides. The other honest gap: the IAM policy on the finance app’s instance role already grants RDS and DynamoDB access that nothing in the Terraform provisions yet, permissions sitting ahead of the resources they’re meant to guard, which I’d rather narrow than leave broad “just in case.”
