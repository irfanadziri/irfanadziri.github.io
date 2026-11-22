# Public ingress, without public compute

> A hub-and-spoke landing-zone network: a public ALB fronting private ECS Fargate services over PrivateLink, plus a hardened SFTP-to-S3 bridge for external file exchange.

- Type: Case study
- Role: Platform engineer (networking)
- Period: Feb 2026 → Jul 2026
- Employer: a global automotive manufacturer
- Stack: terraform, aws vpc, nlb, alb, privatelink, ecs fargate, acm, ssm parameter store
- Source: https://irfanadziri.dev/work/cloud-landing-zone-networking/

---

The brief across this networking work for a global automotive manufacturer’s cloud landing zones was consistent even though the systems weren’t: put a public front door in front of something that has no business being reachable from the internet, and do it without exposing the compute behind it. Two landing-zone repositories and a purpose-built file-transfer service later, that’s the pattern that held.

## A VPC that expects three availability zones and two kinds of Fargate task

The application landing zone I led wraps a community VPC module into a standard 3-AZ, public/private split, parameterized by CIDR and AZ list rather than hardcoded per environment. Compute on top of it is ECS Fargate, and the module supporting it handles both Linux and Windows tasks in the same code path, which sounds like a footnote until you’ve actually run a Windows container on Fargate. Windows Fargate needs a pinned platform version instead of “latest,” and the container definition’s user field has to be omitted entirely for Windows tasks or the task fails to start; both of those are the kind of thing you only learn by watching a task fail and reading the actual error, and both are now handled automatically by the module rather than something every consumer has to rediscover.

## Public ingress, without public compute

The actual networking design is a hub-and-spoke exposure pattern: an internet-facing ALB with an ACM certificate sits in a public VPC, terminates TLS, and forwards to an IP target group. That target group points at interface VPC endpoint network interfaces, which reach across the account boundary via a VPC endpoint service backed by an internal Network Load Balancer. Only past that layer do requests actually reach the ECS tasks, which stay inside a private VPC the whole time. I authored the NLB module underneath this: internal or public mode, configurable listener and target ports, health-check thresholds, cross-zone balancing, and TLS termination that’s opt-in: a plain TCP listener when there’s no certificate configured, a TLS listener when there is. The result is a public HTTPS endpoint where nothing behind the first hop is actually addressable from outside the private network.

**As built: public ingress chain over privatelink.** public vpc: 3 az contains internet-facing alb: https 443, acm tls; interface vpc endpoint enis. private vpc: 3 az contains vpc endpoint service; internal nlb: tls to tcp; ecs fargate tasks: linux / windows; ssm parameter store. external client → internet-facing alb: https 443, acm tls. internet-facing alb: https 443, acm tls → interface vpc endpoint enis (ip target group). interface vpc endpoint enis → vpc endpoint service (privatelink). vpc endpoint service → internal nlb: tls to tcp. internal nlb: tls to tcp → ecs fargate tasks: linux / windows. ecs fargate tasks: linux / windows connects loosely to ssm parameter store (reads config).

Secrets for the services sitting behind that boundary moved out of tfvars and into SSM Parameter Store partway through. It was a deliberate cleanup: once the pattern of reading shared config from SSM at plan time was already established for the networking values, it made no sense for application secrets to be the one thing still living in a variables file.

## A hardened SFTP bridge, container by container

The file-transfer piece is smaller in scope but fully mine end to end: a containerized SFTP endpoint that syncs bidirectionally with S3. On boot, the container fetches its authorized public key from SSM Parameter Store rather than baking it into the image, generates its own host keys if they don’t exist yet, and starts a filesystem watcher that mirrors every change in the chroot’d upload directory to S3. Writes go up with server-side KMS encryption and retry-with-backoff, deletes go through as object removals, and the container does an initial sync pull on startup so it’s never out of sync with the bucket it’s paired with. User provisioning runs every field through strict validation before it ever reaches the system’s user-creation tools, specifically to keep a malformed config entry from becoming a shell injection. The supervisor pattern is deliberately blunt: if the sync watcher dies, the entrypoint kills the container’s main process, and the orchestrator restarts the whole task. It self-heals by restart rather than by trying to recover the watcher process in place.

**As built: the sftp-to-s3 bridge container.** ecs fargate container contains openssh: chroot'd upload dir; filesystem watcher: s3 sync. ssm parameter store: authorized key → openssh: chroot'd upload dir (fetched at boot). sftp client: key-based auth → openssh: chroot'd upload dir (sftp over the tls nlb). openssh: chroot'd upload dir → filesystem watcher: s3 sync (file events). filesystem watcher: s3 sync → s3 bucket: sse-kms (put / rm with kms encryption). s3 bucket: sse-kms → openssh: chroot'd upload dir (initial sync pull).

## What this wasn’t

It wasn’t a landing zone I drew from nothing, and not all of it is mine. The VPC underneath is a community module I wrapped and parameterised rather than wrote, and of the two landing-zone repositories, the one I led was the application landing zone. What I can claim outright is narrower: the NLB module behind the ingress chain, the Windows and Linux Fargate handling, and the SFTP bridge, which is the one piece here that’s mine end to end.

## What I’d change

TLS on this design terminates twice, once at the public ALB and once again at the internal NLB in front of the ECS tasks, and in the environments I’ve built so far that’s redundant rather than defense-in-depth, because both certificates are managed by the same account and the same process. I’d collapse that to a single termination point once the certificate story is consistent across every environment this pattern gets deployed into; running it twice was the safe default while the pattern was still new, not a permanent design choice.
