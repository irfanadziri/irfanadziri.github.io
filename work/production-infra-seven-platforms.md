# The client changes, the skeleton doesn't

> Infrastructure engineer across seven production AWS platforms built for a software house's clients. Sole author of most, and the provisioning engineer on the largest: a ministry's AWS landing zone of three workload accounts, whose design came from an AWS principal architect. One nested-stack CloudFormation pattern, re-cut per platform, from a full nine-stack web build down to a single IAM governance stack.

- Type: Case study
- Role: Infrastructure engineer
- Period: Jul 2024 → Feb 2025
- Employer: an AWS-partner software house
- Stack: cloudformation, nested stacks, vpc, cloudfront, waf, aurora, rds proxy, aws backup, iam
- Source: https://irfanadziri.dev/work/production-infra-seven-platforms/

---

After the internship converted into a full role, the work became infrastructure and nothing else. Over roughly eight months I was responsible for the AWS infrastructure of seven production platforms the company built for its clients, provisioning it and then maintaining it once it was running. For most of them I designed the architecture as well; the largest was the exception, and an important one: a ministry’s AWS landing zone of three workload accounts, whose design came from an AWS principal architect, which I provisioned and then evolved rather than drew. I’ll come back to it. Either way, that maintaining part matters more than it sounds. These weren’t hand-offs. The platforms stayed live, and staying live is a different job from standing something up.

Everything was hand-written CloudFormation YAML. No Terraform yet, no console clicking, no template wizard output.

## One pattern, seven cuts

Every multi-stack platform ran the same shape: a root `main.yaml` composing S3-hosted child templates through `AWS::CloudFormation::Stack`, with `!GetAtt` carrying outputs between them: VPC subnet and security-group IDs into the compute and load-balancer stacks, the IAM instance profile into compute. No child stack ever held another child’s resource IDs as literals. The reasoning behind that constraint, and what it buys you, is documented as its own system elsewhere in this set.

What varied was how much of the graph a given platform actually needed. One of the fullest was a public-facing web platform: nine child stacks covering VPC, an autoscaling EC2 tier behind an ALB, CloudFront with a WAF web ACL in front of it, a Cognito user pool with custom schema attributes, three DynamoDB tables, SES for outbound mail, and an OpenSearch domain deployed inside the VPC rather than exposed publicly.

That one was the document repository I had built by hand during the internship a few months earlier: the same platform, re-expressed as templates. Codifying a system I’d personally clicked into existence is a specific and useful kind of exercise: every resource in the graph was one I could remember creating, so the gap between “it works” and “it is reproducible” was impossible to hand-wave. Nothing teaches the value of a template faster than writing one for infrastructure you built the other way first. That system’s own story, including the part of its architecture that didn’t survive to deployment, is CASE 06. The smallest was a single IAM stack (groups, policies, and users provisioning access to an HPC environment) built with the same templated rigour as the big one, because ad-hoc IAM is how access sprawl starts.

Between those two ends sat the specialist work: a three-instance Aurora cluster behind an RDS Proxy with its own subnet group, so connection pooling was a design decision rather than a later rescue; AWS Backup codified as vault, plan, selection, and service role, making DR a template rather than a runbook; a WAFv2 web ACL split into an independently deployable stack; and private connectivity built from five interface VPC endpoints plus an EC2 Instance Connect Endpoint, which removed the SSH jump box from the architecture entirely instead of hardening it.

The largest single engagement here wasn’t one I designed, but it was one I built. A government ministry’s environment was an AWS landing zone with three workload accounts, and those workload accounts were where I worked. The architecture arrived as a diagram: a draw\.io from an AWS principal architect, with the zone’s foundation provisioned by my senior solutions architect. Everything below that diagram was mine to write. I authored the infrastructure-as-code for all three workload accounts myself, turning the drawing into running infrastructure, and then evolved it as the application teams came back with requests that fell within the approved scope, each change signed off by the same senior SA. I didn’t draw the architecture and I won’t claim I did; but designer and builder are different jobs, and on the biggest thing I touched here I was the builder, front to back. That’s the distinction I’d rather draw plainly than let the diagram’s authorship and the code’s authorship blur into one.

**As built: one root-stack pattern, re-cut across seven production platforms.** full platforms contains 9-stack web platform, vpc · asg+alb · cloudfront+waf, cognito · dynamodb · opensearch · ses; ministry landing zone: 3 workload accounts, vpc · alb · ec2 asg · cloudfront+waf, draw\.io by aws principal architect · iac + evolution mine. single-concern platforms contains aurora cluster + rds proxy; aws backup: vault · plan · selection; wafv2 web acl; vpc endpoints + eice: no bastion; iam groups/policies for hpc. shared pattern: root main.yaml, s3-hosted children · !GetAtt wiring → 9-stack web platform, vpc · asg+alb · cloudfront+waf, cognito · dynamodb · opensearch · ses. shared pattern: root main.yaml, s3-hosted children · !GetAtt wiring → ministry landing zone: 3 workload accounts, vpc · alb · ec2 asg · cloudfront+waf, draw\.io by aws principal architect · iac + evolution mine. shared pattern: root main.yaml, s3-hosted children · !GetAtt wiring → aurora cluster + rds proxy. shared pattern: root main.yaml, s3-hosted children · !GetAtt wiring → aws backup: vault · plan · selection. shared pattern: root main.yaml, s3-hosted children · !GetAtt wiring → wafv2 web acl. shared pattern: root main.yaml, s3-hosted children · !GetAtt wiring → vpc endpoints + eice: no bastion. shared pattern: root main.yaml, s3-hosted children · !GetAtt wiring connects loosely to iam groups/policies for hpc (same rigour, no nesting needed).

## Production ownership at a smaller scale

This was real production with real users on it, and it was smaller than what came after. Both of those are true and worth stating together, because the temptation with a first infrastructure role is to describe it in the vocabulary of the later ones. On most of these platforms I was working greenfield (no platform team to absorb a mistake, no shared landing zone already built, no reference architecture to consume) and not much of the scale that makes those things necessary. The ministry landing zone was the exception on every count: a principal-architect design, a zone my senior SA had already stood up, application teams to answer to. It’s the one place here where I was building inside someone else’s lines rather than drawing my own, and knowing the difference between those two jobs is part of what the role taught. The rest of it taught breadth: seven platforms in eight months means seven different sets of requirements landing on a shared pattern, which is a faster way to find out where a pattern breaks than running one system for years.

## What survives, and what doesn’t

The delivery repositories lived on the company’s Bitbucket and I lost access to them when I left. What exists now is an extraction: my own authored templates, pulled into a private personal repository between July 2024 and February 2025, with client values and account data stripped out.

So the template content is first-hand evidence of the design work, and the dates are not evidence of delivery: they record when I preserved a template, not when the platform shipped. Which platform each template came from was never tracked. Every date attached to this period is approximate, and I’d rather say so than present a preservation timestamp as a delivery milestone.

## What this wasn’t

It wasn’t enterprise scale, and it wasn’t all my design. These were real production platforms with real users, but small ones, mostly greenfield, with no platform team or shared landing zone behind them. The largest, a ministry’s landing zone of three workload accounts, was designed by an AWS principal architect: I provisioned it and then evolved it, but I didn’t draw it.

## What I’d change

I’d version the pattern instead of copying it. Each platform got its own cut of the root stack and its children, so an improvement made on one platform, a tighter security group or a better backup selection, only reached the others if I carried it across by hand. A small library of versioned child templates, consumed by each platform’s root stack, would have made the pattern something the platforms shared rather than something each of them held a copy of.

The second change is cheaper. I’d record which platform every template belongs to while I still had access to the delivery repositories. The extraction I kept is honest evidence of the design work, but it can’t say which client’s platform a given template ran, and a one-line note per template at the time would have settled that for good.
