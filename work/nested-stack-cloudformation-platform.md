# One root stack, nine wired children

> A nested CloudFormation pattern, repeated across seven production platforms, that wires stacks together through cross-stack outputs instead of hardcoded resource identifiers.

- Type: System doc
- Domain: infra
- Stack: cloudformation, nested stacks, cloudfront, waf, cognito, iam
- Source: https://irfanadziri.dev/work/nested-stack-cloudformation-platform/

---

**Figure 06: Nested-stack CloudFormation platform.** Diagram: per-build stack parameters feed one root stack, which deploys four nested child stacks as a single unit (network with the VPC, edge with CloudFront and WAF, compute with the auto-scaling group and ALB, data with Aurora); the same template is re-cut across seven platforms.

A monolithic CloudFormation template works until it doesn’t. Past a certain size, one template becomes one blast radius, and every unrelated change risks touching every resource. The platform I built for this class of system composes a root stack over nine child templates instead: networking, identity, compute, search, and edge each get their own file, wired together through cross-stack outputs rather than copy-pasted resource IDs. I’ve used this same shape across seven production platforms, from full builds down to a single IAM-governance stack.

## The rule underneath the nesting

Nesting on its own isn’t the interesting part. Plenty of templates nest stacks and still hardcode the values passing between them. What mattered was refusing to let any child stack know another child’s resource IDs in advance. The VPC stack’s subnet and security-group IDs flow into the EC2 and ALB stacks by output; the IAM stack’s instance profile flows into compute the same way. Nothing downstream is typed in as a literal. Add a stack, remove one, reorder the graph, and the wiring still resolves correctly because it was never actually hardwired.

## What varied per platform

The root pattern stayed constant; what hung off it didn’t. One platform needed the full graph: a VPC, auto-scaling compute behind an ALB, CloudFront in front of a WAF web ACL, a Cognito user pool with custom attributes, and a search domain running inside the VPC instead of exposed publicly. Others needed one slice of it: an Aurora cluster behind RDS Proxy, an AWS Backup vault and plan codified as its own stack, or private connectivity built entirely from VPC endpoints and an EC2 Instance Connect endpoint, with no bastion host anywhere in the graph.

## Where it stands now

The platforms themselves are delivered; what’s ongoing is generalizing the pattern. I’m pulling the recurring pieces (the root-stack wiring convention, the WAF-fronted edge posture, the bastion-less connectivity module) out of individual platform builds and into a template library that doesn’t assume any one platform’s shape going in.

## Limits

It’s hand-written CloudFormation, and the platforms it ran on aren’t mine to show any more: what exists now is my own extracted templates, with client values stripped out. The template library that generalises the pattern is still in progress, so today the pattern is proven platform by platform rather than packaged as something another team could pick up.
