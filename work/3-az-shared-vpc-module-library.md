# One VPC per org, not per app

> A 3-AZ VPC shared across every application in a small organization, plus the Terraform module library being generalized from it.

- Type: System doc
- Domain: network
- Stack: terraform, vpc, nat gateway, s3 backend
- Source: https://irfanadziri.dev/work/3-az-shared-vpc-module-library/

---

**Figure 07: 3-AZ shared VPC & module library.** Diagram: a git-ref-pinned module library provides one VPC module call that builds, across three availability zones, public subnets with the ALB and internet gateway, one NAT gateway per AZ, and private subnets for app and data, used by the ECS, EC2 and RDS workloads.

The default instinct is one VPC per application: clean on paper and expensive in practice. The network I designed instead is a single 3-AZ VPC shared across every application in a small organization, with public and private subnets split cleanly across all three zones and NAT gateway creation left as a variable rather than a permanent cost, because a sandbox environment doesn’t need three NAT gateways running around the clock.

## The decision that proved it out

The proof that “shared, not per-app” was the right call came from fixing my own mistake. A second application’s stack originally provisioned its own duplicate VPC rather than consuming the shared one, and the two Terraform graphs ended up in a dependency cycle neither could resolve. The fix wasn’t a workaround. It was deleting the duplicate VPC module outright and pointing the application’s security group at the shared VPC’s actual outputs. Consolidating onto one network removed the redundant infrastructure and the unstable dependency graph in the same change.

## Generalizing the module

The VPC module itself has moved twice: first as a thin wrapper around a third-party registry module, now as a hand-rolled module with dynamic, object-typed ingress and egress rules, published for git-source consumption so any project can pull a specific ref instead of copying the file. That’s the direction the library is heading: fewer registry dependencies, more of the org’s own conventions expressed directly in the module.

## Limits

State for this VPC currently lives in a single S3 backend with no DynamoDB lock table, which is fine while one person is the only one running apply against it. The moment a second engineer or a second pipeline touches the same state key, that stops being true. Adding the lock table is a ten-minute job I’m doing deliberately before it’s load-bearing, not after.
