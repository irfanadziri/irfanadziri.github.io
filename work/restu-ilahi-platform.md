# A one-off wedding site, refactored into a product

> A solo-built, multi-tenant wedding-invitation platform (deliberately hand-built per client rather than self-serve SaaS) with four templated site designs, a shared row-level-secured Postgres layer, and a dispatched pipeline that provisions a new tenant end to end on Terraform and GitHub Actions.

- Type: Case study
- Role: Sole infrastructure & delivery author
- Period: Dec 2025 → Jul 2026
- Employer: Restu Ilahi
- Live: restuilahi.com
- Stack: astro, next.js, supabase, terraform, github actions, oidc, aws amplify, cloudflare
- Source: https://irfanadziri.dev/work/restu-ilahi-platform/

---

The default trajectory for a wedding website you build for your own wedding is: ship it, use it once, let the repository go quiet. Mine hit that a few months in, and instead of walking away I refactored it into a product: a multi-tenant platform with four interchangeable site designs, a shared back office, and a pipeline that provisions a new client’s custom-domain site end to end. It’s deliberately not self-serve SaaS. Clients can’t configure a site themselves. They come through a two-person marketing team (friends of mine who run the sales side), and I build each one by hand, picking the skin, tuning the details, and dispatching the provisioning myself. I like it hand-touched, so the machinery underneath is product-grade while the finish stays bespoke; if the request volume ever outgrows that, turning it into real self-service is a switch I’ve deliberately left myself room to flip. I designed, built, and operate every layer alone: the Astro front ends, the shared Supabase data layer, the Next.js back office, and the Terraform and GitHub Actions machinery that provisions a new tenant end to end.

**As built: tenant provisioning, delivery, and the shared data layer.** canonical template: github template repo → glassmorphism skin (use this template). canonical template: github template repo → klasik skin (use this template). canonical template: github template repo → minimalism skin (use this template). create-client: dispatched workflow → client repo: private, topic-tagged (create from template · seed secrets + tier). client repo: private, topic-tagged → infra run: terraform plan / apply. infra run: terraform plan / apply → aws amplify app + branch. aws amplify app + branch → cloudflare dns (cname only after cert verifies). client repo: private, topic-tagged → shared supabase postgres: rls per tenant (register tenant). shared supabase postgres: rls per tenant → edge functions: rsvp · photo uploads. edge functions: rsvp · photo uploads → shared photos bucket: per-tenant prefix (pre-signed urls). back office: next.js on workers → shared supabase postgres: rls per tenant.

## From one site to four skins

The original site is now the canonical template (a GitHub template repository, not a fork source), and three visually distinct variants were spun from it using GitHub’s native template feature, each diverging independently from that point on. They share a config contract (the same client-configuration and card-rendering shape) without sharing git history, which means keeping them in parity is a discipline I enforce with small purpose-built tooling rather than a merge: one script rebuilds the shared design-token unions from all four templates and diffs them against what the base ships, another pulls shared asset libraries across siblings. It’s manual by design: the four skins are meant to diverge, just not accidentally.

## A pipeline that provisions a tenant, not just deploys code

Standing up a new client is a dispatched workflow, not a checklist: it creates the private repo from the right template, tags it with a theme-specific topic, copies over the secrets and variables a fresh tenant needs, patches the sales tier into the Terraform variables and client config, and hands off to an infrastructure run that provisions the AWS side. Every site deploys to AWS Amplify; Cloudflare only handles DNS, because that’s the one piece of this stack I didn’t want tied to a single provider. Cutting a new domain over is its own deliberately manual gate: a cutover workflow flips a boolean and re-applies, so the Cloudflare CNAME only gets created after Amplify’s certificate has actually verified. I added that gate after thinking through the alternative: a DNS record pointing at an endpoint that isn’t ready yet is a worse failure mode than a slightly slower cutover.

## One database, isolated by row, not by instance

Every tenant site and the internal back office share a single Supabase Postgres project rather than one database per client. Tenant isolation happens at the row level, not the infrastructure level. Each client site ships with its own signed JWT carrying a tenant claim, so the anonymous client hitting Supabase is already scoped by the time it makes its first query; the row-level security policy just checks that claim against the row. Guest photo uploads never touch my server at all. An edge function validates the guest’s passphrase and hands back a pre-signed S3 URL, and the browser uploads directly.

The workflow that bootstraps and tears down tenants carries the same guard pattern I’ve used elsewhere: a job with no `if:` condition that always runs and fails loudly if it’s dispatched from anywhere but the canonical template repo, or if a client-only action gets dispatched from the template itself. GitHub reports an all-skipped run as green, and a guard job that only runs conditionally can’t catch that, so this one runs unconditionally, on purpose.

## Fan-out, and the one time it clobbered something

Template changes reach every live client as a reviewable pull request against that client’s own branch, not a direct push. A workflow archives the template’s current state, syncs it into a fresh clone of each client repo while skipping an explicit ignore-list of client-owned files, and opens a PR only if anything actually changed. A merge-strategy attribute marks the client-specific files so a template merge can’t silently overwrite them. It’s worked as designed almost every time. The one exception: a sync PR once landed and reverted a personal sign-off in a footer that wasn’t yet on the ignore-list, and I had to manually reapply it. Nobody got hurt by it, but it’s the reminder that an ignore-list is a living document, not a one-time decision. I update it the moment a new client-owned field shows up, not after it gets clobbered a second time.

**As built: template fan-out as reviewable pull requests.** merge to main in a template repo → sync workflow fires. sync workflow fires → list client repos by topic. list client repos by topic → archive template head. archive template head → rsync into each client clone: ignore-list applied. rsync into each client clone: ignore-list applied → f. f → skip: logged in run summary (no). f → push sync branch (yes). push sync branch → open pr against the client's dev branch. open pr against the client's dev branch → human review, then merge.

## Pulling the bootstrap infra out of the product repo

The very first version of this had a one-off Terraform directory living inside the core template repo, provisioning the shared state bucket, the GitHub OIDC role, and a photos bucket alongside the actual product code. I pulled all of that out into a standalone personal infrastructure monorepo the same day, with a shared tagging module and a per-project convention, specifically so the next personal project wouldn’t repeat the same setup from scratch. It’s a design built for more than one tenant that currently has exactly one, a bet on future reuse I’m comfortable having made early rather than retrofitting later.

## What this wasn’t

It isn’t self-serve SaaS, and it isn’t trying to be. Clients can’t configure a site themselves: they come through a two-person marketing team who run the sales side, and I build each site by hand, picking the skin, tuning the details and dispatching the provisioning myself. The machinery underneath is product-grade; turning it into real self-service is a switch I’ve left myself room to flip, not one I’ve flipped.

## What I’d change

The public marketing site is the one piece of this platform without a documented deployment story. It’s a static build with no adapter or CDN configuration committed anywhere, which means its actual hosting path lives in my memory instead of in the repo. Everything else in this platform is provisioned by something I can point to; that one isn’t yet, and it’s the next thing I’m fixing specifically because “works today, undocumented” is exactly the kind of gap that turns into a bad afternoon later.
