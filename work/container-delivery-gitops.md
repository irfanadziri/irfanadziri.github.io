# The plumbing nobody notices until it breaks

> Focused containerization, delivery-pipeline, and Helm chart contributions to two larger platform teams' systems: a .NET retail-reporting app and a Kubernetes microservice platform.

- Type: Case study
- Role: Devops engineer (supporting)
- Period: Jul 2025 → Feb 2026
- Employer: a global automotive manufacturer
- Stack: docker, github actions, helm, istio, argocd, .net 8
- Source: https://irfanadziri.dev/work/container-delivery-gitops/

---

Not every engagement is the one you own end to end. On two much larger systems for a global automotive manufacturer (a .NET retail-reporting application and a Kubernetes-based microservice platform), my footprint was small and specific: containerization, delivery pipelines, and Helm chart scaffolding, contributed into codebases someone else architected and mostly owns. Both are honestly modest in scope. Neither is padded here to look bigger than it was.

## A .NET app’s delivery layer

The application itself (an ASP.NET Core reporting tool with enterprise SSO and scheduled background jobs) was someone else’s, and stayed someone else’s. What I added sat entirely at the edges: a multi-stage Docker build, an enterprise CA trust bundle baked into the container’s trust store so it could actually reach internal endpoints over TLS, a startup connectivity probe that fails fast against a known internal target before the app process ever starts, and a lightweight health-check endpoint for the orchestrator to poll. On the delivery side I added branch-guard jobs to the release workflows so a workflow could only run from the branch it was meant to, and put environment protection rules in front of both the pre-production and production release paths. None of it is business logic. All of it is the difference between an image that builds and an image that’s safe to actually roll out.

**As built: the delivery layer around someone else's app.** .net 8 container contains startup probe: fails fast; asp.net core app: not mine; health endpoint. branch-guarded release workflows → internal registry (build + push). internal registry → .net 8 container (deploy). startup probe: fails fast → asp.net core app: not mine. asp.net core app: not mine → health endpoint. enterprise ca trust bundle connects loosely to asp.net core app: not mine (baked into the image).

## Helm charts for someone else’s platform

The second system was a multi-service .NET and Angular platform already running on an internal Kubernetes cluster behind Istio, deployed through ArgoCD. My contribution there was narrower still: Helm chart scaffolding for a handful of the backend services (health probes, autoscaling, security context, Istio virtual-service routing), following the pattern the rest of the platform’s charts already used rather than inventing a new one, plus two small fixes (a database connection-string reference and an incorrect image-registry path) and a couple of workflow-input refinements to the GitOps deploy pipeline’s cluster and service selectors.

**As built: the gitops deploy path.** developer dispatch → resolve cluster / service. resolve cluster / service → build image → internal registry. build image → internal registry → image scan. image scan → argocd gitops deploy. argocd gitops deploy → helm charts + per-env values. helm charts + per-env values → internal kubernetes cluster: istio mesh.

## What this wasn’t

I didn’t design either platform’s architecture, and I’m not claiming otherwise. What both engagements gave me was repeated, hands-on practice with the same delivery primitives (multi-stage container builds, TLS trust and health-checking at the container boundary, Helm as the unit of deployment, GitOps as the deployment mechanism) applied inside two codebases I didn’t own, which is a different, and in its own way harder, skill than building the same primitives inside my own.

## What I’d change

Baking the enterprise CA bundle into the image solved the immediate problem, and it ties every certificate rotation to an image rebuild and a redeploy. I’d rather mount the bundle at runtime, from a secret or config map the platform team already manages, or get it into a shared base image that one team owns, so a CA change becomes a configuration change instead of a release.

On the Helm side, both fixes I made, the connection-string reference and the image-registry path, were the kind of mistake that only shows up once a deploy fails. A render-and-lint step in the pipeline (`helm template` against each environment’s values, plus a values schema) would have caught both before ArgoCD ever saw them. Neither change was mine to make alone on platforms I didn’t own; both are what I’d propose first.
