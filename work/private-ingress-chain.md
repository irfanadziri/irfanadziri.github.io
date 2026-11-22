# Public front door, private compute

> A cross-account ingress path where a shared ALB is the only public surface and every workload behind it keeps no public IP.

- Type: System doc
- Domain: network
- Stack: alb, privatelink, nlb, fargate, acm, terraform
- Source: https://irfanadziri.dev/work/private-ingress-chain/

---

**Figure 02: Private ingress chain.** Diagram: users reach a public ALB over HTTPS; the ALB forwards through a PrivateLink VPC endpoint service into a private VPC with no public IPs, where an internal NLB with optional ACM TLS fronts private Fargate tasks.

The compute never gets a public IP, no matter how public the service in front of it looks. HTTPS terminates at a shared Application Load Balancer, and everything past that point crosses into a VPC that has no route to the internet at all. PrivateLink carries the request across the account boundary; an internal NLB fans it out to Fargate. From the outside it looks like a normal web endpoint. From the inside, nothing downstream of the ALB can be reached directly, ever.

## Why the account boundary matters

Most teams solve “keep compute private” with a single VPC and a security group. This one solves it across an account boundary: the ALB lives in a shared front-door account, the workload lives in its own private VPC, and PrivateLink is the only thing connecting them: a VPC Endpoint Service on one side, interface endpoint ENIs on the other. There’s no VPC peering to maintain and no transit gateway route table to keep consistent, and there’s no way to reach the workload except through the endpoint service. Adding a new internal service means publishing a new endpoint service, not renegotiating a shared network.

## What the NLB module hides

The internal NLB is packaged as a Terraform module with internal and public modes, configurable listener and target ports, cross-zone load balancing, and TLS termination that’s opt-in: pass a certificate ARN and the listener switches from plain TCP to TLS, otherwise it stays TCP and lets the target handle it. Health-check thresholds are parameters, not hardcoded assumptions, because a Windows Fargate task and a Linux one don’t fail the same way, and the same threshold isn’t always the right one for both.

## Where Fargate earns its keep

The compute side runs Fargate for both Linux and Windows tasks, which sounds symmetrical until you hit the platform-version pinning: Windows containers on Fargate need an explicit platform version rather than `LATEST`, and the container definition can’t carry a `user` field the way Linux ones do. The module absorbs that difference so the caller doesn’t have to know it exists. Secrets for the running service come from SSM Parameter Store, resolved at deploy time, never written into a `tfvars` file that ends up sitting in state or git history.

## Limits

TLS currently terminates twice, at the public ALB and again at the internal NLB. In the environments built so far that’s redundant rather than defence in depth, because both certificates are managed by the same account and the same process; it was the safe default while the pattern was new. The pattern also only covers the path in: it keeps compute unaddressable, and says nothing about what that compute can reach on the way out.
