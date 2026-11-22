# One template, a fleet of sites

> A templated provisioning pipeline that spins up client sites onto shared infrastructure and enforces tenant isolation at the database layer instead of in application code.

- Type: System doc
- Domain: infra
- Stack: astro, github actions, terraform, amplify, cloudflare dns, supabase rls
- Source: https://irfanadziri.dev/work/fleet-provisioning-platform/

---

**Figure 04: Fleet provisioning platform.** Diagram: a template repo with four design skins feeds a create-client workflow that creates a client repo with secrets and a sales tier; each client repo runs per-client Terraform for Amplify and ACM, then a certificate-gated DNS cutover, and registers its tenant in a shared Supabase database isolated by row-level security and per-tenant JWTs.

Tenancy lives in the database, not the application code. One template repository provisions every client site (repo creation, secret and variable copying, tier-adjusted feature flags, infrastructure, DNS), and every site that comes out of it shares one Postgres project instead of getting its own. If a request reaches the database with the wrong tenant claim in its token, row-level security refuses it before the query runs, regardless of what the application layer thinks it’s allowed to do.

## The design decision

I could have given each client its own database, its own Supabase project, its own migration history to keep in sync. Instead every client site ships with a per-tenant signed JWT baked into its environment at provisioning time, and a single RLS policy on each table scopes reads and writes to the tenant claim inside that token. The anonymous client is already tenant-scoped the moment it connects. There’s no header to forget and no application-level filter that a future change could quietly drop. Four design skins currently share this same data layer and provisioning path.

## Provisioning as a pipeline, not a runbook

A create-client workflow does the repo creation, copies secrets and variables from the template, patches the tier-specific config, and hands off to infrastructure setup: Amplify and ACM through Terraform, one client app per site. DNS is deliberately the last step: a separate cutover workflow only creates the Cloudflare CNAME after the ACM certificate has verified, which rules out the half-provisioned custom domain that a single combined step would risk.

## Keeping the fleet in sync

The harder problem isn’t provisioning a site once. It’s changing the template after ten sites already exist from it. Every push to the template’s main branch diffs itself against each live client and opens a pull request against that client’s branch rather than pushing directly, so a template change is reviewable per site before it lands, and a client-owned file is never silently overwritten by the sync.

## Limits

Everything rests on one shared Postgres project. Tenant isolation is exactly as strong as the row-level security policy on each table and the JWT each site ships with; there’s no second, infrastructure-level boundary behind it. The fleet is also small and hand-run: four design skins, a provisioning path I dispatch myself, and a sync ignore-list that has to be kept current by hand.
