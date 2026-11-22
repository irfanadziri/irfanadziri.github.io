# Shipping Terraform Through a Governed Platform: Where the Time Actually Goes

> A field report on a multi-environment Terraform rollout through CI-gated pipelines and shared platform modules: where the time went, the SOP that worked, and what would make it lighter.

- Type: Post
- Published: 2026-08-03
- Tags: terraform, ci-cd, github-actions
- Source: https://irfanadziri.dev/posts/terraform-rollouts-through-a-governed-platform/

---

> **Context:** This comes from one delivery cycle on the platforms described in [CASE 03](https://irfanadziri.dev/work/enterprise-app-platform-iac): thin Terraform stacks consuming a shared reference-architecture module, deployed through GitHub Actions to nonprod and prod. It’s written from my seat as the engineer doing the rollout.

I wrote this to document what I actually went through in a real delivery cycle, and why the platform process felt heavy from a Cloud DevOps engineer’s point of view.

If you’re a technical reader (SRE, platform engineer, cloud engineer or DevOps), this is the practical view: where execution time really went, why delivery slowed down, and which SOP changes would reduce both risk and cycle time.

A governed platform is supposed to make risky changes slow. The problem is that it makes routine changes slow too.

## The setup

- **Stack:** Terraform, GitHub Actions, AWS, versioned internal platform modules
- **Environments:** nonprod (deployable from branches) and prod (deployable only from `main`)
- **Source of truth:** plan and apply output in the centralized GitHub Actions runs

## In short

The hardest part was not writing Terraform. The hardest part was navigating platform coupling:

- Deployment truth existed only in centralized GitHub Actions runs.
- Local access was enough for diagnosis, but not enough for full validation.
- A module-level behaviour (RDS gp3 iops handling) caused a deterministic apply failure.
- Branching and promotion constraints increased coordination overhead.
- Listener rule ordering and phased secret wiring needed careful sequencing.

The rollout succeeded in the end, but only after multiple plan/apply cycles, a deep trace through the module chain, controlled sequencing and cross-team escalation.

## Process map

**The rollout path: amber steps are where the friction was.** Change request arrives → Validate access: AWS, Git, workflow dispatch. Validate access: AWS, Git, workflow dispatch → Run/inspect nonprod plan · slowed by CI-only validation. Run/inspect nonprod plan · slowed by CI-only validation → Risky or surprising drift?. Risky or surprising drift? → Trace module chain and live AWS state · permission asymmetry blocks direct fixes (Yes). Trace module chain and live AWS state · permission asymmetry blocks direct fixes → Identify deterministic root cause · module default surprises trigger rework. Identify deterministic root cause · module default surprises trigger rework → Implement minimal code fix. Implement minimal code fix → Proceed with controlled rollout. Risky or surprising drift? → Proceed with controlled rollout (No). Proceed with controlled rollout → Nonprod phase 1: create infra and placeholders. Nonprod phase 1: create infra and placeholders → Nonprod phase 2: wire secrets and routes · listener rule ordering causes plan noise. Nonprod phase 2: wire secrets and routes · listener rule ordering causes plan noise → Review prod plan on main. Review prod plan on main → Approval + policy gates pass?. Approval + policy gates pass? → Escalate, annotate risk, rework (No). Escalate, annotate risk, rework → Review prod plan on main. Approval + policy gates pass? → Prod phase 1, then phase 2 apply (Yes). Prod phase 1, then phase 2 apply → Post-change verification. Post-change verification → Branch cleanup and evidence capture. Branch cleanup and evidence capture → Postmortem and SOP improvement updates. Friction points: Run/inspect nonprod plan · slowed by CI-only validation; Trace module chain and live AWS state · permission asymmetry blocks direct fixes; Identify deterministic root cause · module default surprises trigger rework; Nonprod phase 2: wire secrets and routes · listener rule ordering causes plan noise.

## What made the process feel cumbersome

### 1. Validation bottleneck in CI

What happened:

- Nonprod could be tested from branches.
- Prod was gated to `main`.
- Authoritative plan/apply visibility came only from GitHub Actions logs.

Why it cost time:

- I couldn’t close feedback loops quickly on my own machine.
- Every critical verification step depended on the pipeline queue, permissions and approvals.

### 2. Hidden complexity in module chains

What happened:

- The consumer repo referenced a shared reference-architecture module.
- That module referenced lower-level platform modules.
- Actual behaviour came from the entire chain, not one file in one repo.

Why it cost time:

- The root cause (an invalid gp3 iops value coming down the chain) was not obvious.
- Fixing state alone didn’t fix the configuration behaviour.
- I had to trace across repositories and versions to find it.

The fix itself was small once found: set the value explicitly in the consumer stack instead of relying on the inherited default.

### 3. Permission asymmetry

What happened:

- My engineering role could inspect most resources.
- The deployment role, not my own, is what applies changes, and the two don’t hold the same permissions.

Why it cost time:

- Diagnosis and remediation were split across identities.
- Even when I knew the fix, applying it still went back through the pipeline.

### 4. Multi-phase change sequencing

What happened:

- Secrets had to exist before they could be mounted.
- The rollout needed phase 1 (infrastructure) before phase 2 (wiring).
- Listener rules needed order-safe insertion to avoid a collateral diff.

Why it cost time:

- Straightforward changes became multi-step operational procedures.
- Without strict sequencing, the risk of accidental side effects went up.

### 5. Branch hygiene and promotion friction

What happened:

- Long-lived integration branches and short-lived feature branches coexisted.
- Squash merges reduced the branch count but made ahead/behind counts noisy.
- Safe remote cleanup needed deliberate verification.

Why it cost time:

- Routine Git operations took more thought than they should.
- Time went into proving a branch was safe to delete instead of shipping changes.

## The pattern that kept repeating

In practice, the same loop came back on every non-trivial change:

1. A plan shows significant drift or surprising changes.
2. I investigate whether the drift is real, stale state, or module behaviour.
3. I gather evidence from pipeline logs, live AWS and commit history.
4. I prepare a minimal-risk code fix.
5. Nonprod proves the sequence is safe.
6. Prod runs with stricter controls.
7. Branches and operational loose ends get cleaned up.

This loop is reasonable for high-risk systems, but expensive for medium-risk, frequent platform operations.

## The SOP that actually worked

This is what I’d hand to another engineer doing the same kind of rollout under similar platform constraints.

### Phase A: Access and evidence baseline

- Verify AWS identity/profile and the target account.
- Verify repo remote access and authentication.
- Verify workflow dispatch permissions.
- Record baseline run links and key environment assumptions.

**Success criteria:** you can read the infra, trigger workflows, and match logs to code.

### Phase B: Drift classification

- Split findings into:

  - Functional risk
  - Configuration drift
  - Cleanup/noise drift

- Confirm the live resource before deciding what to do.

**Success criteria:** every planned change is labelled intentional, suspicious or cleanup.

### Phase C: Root-cause tracing through the module chain

- Trace from the consumer repo input to the final provider resource argument.
- Find where defaults or commented-out wiring change the behaviour.
- Check whether state edits alone can resolve the issue or not.

**Success criteria:** one deterministic root cause with a reproducible explanation.

### Phase D: Controlled remediation

- Apply the smallest safe code change first.
- If needed, pin to a known-good module ref.
- Set explicit values for critical parameters instead of relying on implicit defaults.
- Keep commits focused and auditable.

**Success criteria:** the plan delta is understandable and targeted.

### Phase E: Environment rollout sequence

- Nonprod phase 1: resource creation and placeholder-safe wiring.
- Nonprod phase 2: activate secret mounts and path rules.
- Prod phase 1, then phase 2, with the same pattern.
- Avoid list-index insertion side effects by appending in an order-safe way.

**Success criteria:** no hidden destructive change, and services stay healthy.

### Phase F: Closure

- Clean up merged remote branches only after verification.
- Preserve evidence: run IDs, plan summaries, rationale notes.
- Publish a postmortem with SOP improvements.

**Success criteria:** handoff is complete, and future work starts from better documentation.

## Where the time actually went

In this kind of platform model, engineering time tends to go here:

- Gathering evidence and proving intent in plan diffs.
- Coordinating approvals and gated prod workflows.
- Investigating module behaviour across repos.
- Sequencing low-level infrastructure changes to avoid side effects.
- Re-validating the same assumptions across environments.

That’s why the process felt cumbersome: the delivery work is often smaller than the verification and orchestration work around it.

## What would make it lighter

These are the changes I’d ask a platform team for. Each one removes a step from the loop above without removing a control.

### 1. Shift-left on validation

- Provide a supported preflight command that mirrors prod plan logic as closely as possible.
- Fail early on known-invalid combinations (for example, gp3 with `iops = 0`).

### 2. Publish module contract tests

- For each platform module release, publish expected behaviour snapshots.
- Detect changes to defaults for critical parameters.

### 3. Enforce semantic plan guards

- Add policy checks for high-risk diffs (RDS storage/iops, task definition reversions, listener reindexing).
- Require an explicit note to approve an exceptional drift.

### 4. Standardize phased rollout templates

- First-class templates for two-phase secret activation.
- Order-safe helpers for listener path rules.

### 5. Improve branch governance ergonomics

- A periodic automatic report of merged-but-not-deleted branches.
- Clear branch lineage notes for squash-merge workflows.

## My takeaway

The platform was not impossible. It was operable, but operationally heavy.

The difference between a smooth rollout and a delayed one wasn’t technical skill alone. In this case it came down to:

- quality of evidence,
- strict execution sequence,
- understanding hidden module behaviour,
- and sticking to the SOP under constraints.

If platform teams reduce validation friction and make module behaviour more transparent, engineers can spend more time delivering and less time proving.

## One-page SOP checklist

Use this before any medium- or high-impact Terraform rollout:

- [ ] Access check complete (AWS, repo, workflow dispatch)
- [ ] Drift classified (intentional vs suspicious vs cleanup)
- [ ] Module chain traced for critical parameters
- [ ] Nonprod phase 1 and phase 2 validated
- [ ] Prod plan reviewed with risk annotations
- [ ] Apply executed with run evidence captured
- [ ] Branch cleanup completed for merged feature branches
- [ ] Post-change notes published
