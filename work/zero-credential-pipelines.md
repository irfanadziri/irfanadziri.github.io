# Pipelines that hold no credentials

> Two independently built CI/CD pipelines that authenticate to AWS through short-lived OIDC roles instead of stored credentials, gated by a human before every apply.

- Type: System doc
- Domain: ci-cd
- Stack: github actions, oidc, iam, terraform, reusable workflows
- Source: https://irfanadziri.dev/work/zero-credential-pipelines/

---

**Figure 03: Zero-credential pipelines.** Diagram: a pull request triggers terraform plan under a per-run OIDC role; a human approval gate sits between the plan and terraform apply, which uses short-lived credentials to change tagged AWS infrastructure.

No pipeline in this set has ever held an AWS access key. Every plan and apply assumes a short-lived IAM role through GitHub’s OIDC provider, scoped to the repository asking for it, and the credential is gone by the time the job ends. I’ve built this twice, independently, for two different situations, and the shape converges on the same three moves: plan on the pull request, gate the apply behind a human, never let a credential outlive the job.

## Built twice, independently

The first build centralizes the pipeline itself: a small pair of reusable GitHub Actions workflows (one for `terraform plan`, one for `terraform apply`) that every infrastructure repo in an organization calls with `workflow_call`, passing only a region and a role ARN. The organization owns how Terraform runs; each repo only owns what it runs against. The second build serves a fleet of tenant sites instead of a fixed set of internal repos: each client repo dispatches its own plan and apply against a role scoped by a `StringLike` condition to the fleet’s repo namespace, so no client repo can assume a role meant for another. Different shape, same non-negotiable: OIDC in, plan on the PR, apply on approval.

## The guard job

The fleet pipeline carries a safeguard the organization pipeline doesn’t need: a job with no `if:` condition that always runs and fails loudly if a workflow gets dispatched from the wrong repo. It exists because GitHub reports an all-skipped run as a green success. Without the guard, a misconfigured dispatch would look identical to a correct one in the UI. Failing hard beats failing silently, so the job is deliberately unconditional rather than gated.

## What stays constant

Both builds share the same posture on the parts that matter most: role assumption via `aws-actions/configure-aws-credentials`, `id-token: write` and nothing broader, and a plan artifact that’s readable before anyone approves the apply. The difference between them is scope, one role per organization versus one role per repo namespace, not philosophy. Neither one has ever needed a stored secret to talk to AWS.

## Limits

It removes stored AWS credentials, not trust. The IAM role’s trust policy and its permissions become the whole security boundary, and the human gate is only as good as the person reading the plan before approving it. The organisation build also runs without a guard job, because it’s called from a fixed set of repositories; it relies on that staying true.
