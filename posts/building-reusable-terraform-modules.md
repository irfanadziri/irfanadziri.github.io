# Building Reusable Terraform Modules: From Flat to Nested Hierarchies

> What I learned about Terraform module design after going from a single reusable module to a three-tier nested hierarchy: the flexibility it unlocks, and the complexity it introduces.

- Type: Post
- Published: 2026-03-25
- Tags: aws, terraform
- Source: https://irfanadziri.dev/posts/building-reusable-terraform-modules/

---

> **Disclaimer:** This article is based on my own experience building and consuming Terraform modules across different organisations. Module design is opinionated territory: what works at a 5-person team won’t necessarily scale to a platform team serving 50 engineers, and vice versa.

I had been writing reusable Terraform modules for a while before joining my current organization. My model was simple: extract repeated infrastructure into a module, parameterise what varies, call it from multiple places. It worked. Then I joined a larger organisation and discovered that modules can call other modules, and that those modules can call yet another layer of modules. Three tiers deep. That changes how you think about ownership, defaults, and what “reusable” actually means.

---

## The Single Module Approach

Before getting into nested hierarchies, it’s worth being precise about what a basic reusable module looks like and why it already solves a real problem.

A module is just a directory of Terraform files with defined inputs and outputs. You call it with a `module` block and pass in variables:

```hcl
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr        = "10.0.0.0/16"
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.10.0/24", "10.0.20.0/24"]
  enable_nat      = true
}
```

The module encapsulates all the `aws_vpc`, `aws_subnet`, `aws_route_table`, and `aws_internet_gateway` resources. The caller doesn’t need to know how subnets are associated with route tables. It just passes in what it cares about and gets back outputs like `vpc_id` and `private_subnet_ids`.

This is flat module design: one layer of abstraction, one team owns the module, all callers are on the same level. It handles DRY infrastructure and consistent resource configuration well.

Where it starts to strain is when multiple teams need the same module but with different conventions, when a platform team wants to enforce standards that individual teams can’t override, or when a change in the module affects every caller simultaneously with no version isolation between teams.

---

## The Nested Module Hierarchy

At my current organization, the pattern I encountered was a three-tier hierarchy:

```
Project module  (project-specific config)
    └── Team module  (team-wide defaults and conventions)
            └── Platform module  (organisation-wide standards, owned by platform team)
```

Each layer calls the one below it. The platform module is the most generic: it exposes every possible variable and organization’s best practices. The team module wraps the platform module and bakes in team-specific defaults, restricting what individual projects need to worry about. The project module calls the team module with only the variables that are genuinely project-specific.

### Platform Module

The platform module is owned by the platform or infrastructure team. It defines the most fundamental resources and exposes full configurability with the best practices the organization has defines. Think of it as the raw capability layer with security best practice:

```hcl
# modules/platform/vpc/main.tf
resource "aws_vpc" "this" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(var.tags, {
    ManagedBy = "APAC Cloud Platform Team"
  })
}
```

It enforces one thing: the `ManagedBy` tag. Everything else is a variable. The platform team controls the structure and the hard-coded standards. Individual teams don’t call this module directly.

### Team Module

The team module wraps the platform module and applies team-level decisions. It reduces the surface area that project-level callers have to think about:

```hcl
# modules/team/vpc/main.tf
module "vpc" {
  source = "git::https://github.com/org/platform-modules.git//vpc?ref=v2.3.0"

  cidr_block           = var.cidr_block
  enable_dns_hostnames = true   # team standard, not exposed to callers
  enable_dns_support   = true   # team standard, not exposed to callers

  tags = merge(var.tags, {
    Team        = "cloud-coe-MY"
    CostCentre  = var.cost_centre
  })
}
```

`enable_dns_hostnames` and `enable_dns_support` are hardcoded here because every project in the team needs them enabled. There’s no reason to push that decision down to each project. The team module also adds team-level tags that every project must carry.

### Project Module

The project module is where individual engineers work. It calls the team module and only passes what’s genuinely unique to the project:

```hcl
# project/networking/main.tf
module "vpc" {
  source = "git::https://github.com/org/team-modules.git//vpc?ref=v1.1.0"

  cidr_block   = "10.20.0.0/16"
  cost_centre  = "CC-4421"

  tags = {
    Project     = "payment-service"
    Environment = "development"
  }
}
```

Two variables. The project engineer doesn’t need to know what DNS settings are applied, which tags are mandatory, or which version of the platform module is in use. That’s been decided by the layers above.

---

## What the Hierarchy Gets You

### Enforced Standards Without Trust

In a flat module world, a platform team can document that certain tags are required, but there’s nothing stopping a project from omitting them. In the nested hierarchy, those tags are hardcoded in the team module. Projects inherit them whether they think about it or not.

### Blast Radius Control

Changes to the platform module don’t immediately affect all projects. The team module pins a specific version of the platform module (`ref=v2.3.0`). When the platform team releases a new version, the team module upgrades on its own schedule and tests the change before project modules inherit it. Projects are insulated by the team module version pin.

### Smaller Project Configs

Project-level Terraform becomes genuinely minimal. Engineers specify what makes their project unique, not the full configuration of every resource. Onboarding is faster because there’s less to understand and fewer ways to get it wrong.

---

## What the Hierarchy Costs You

### Debugging Depth

When something is wrong with a resource, tracing it back to the source takes three hops. A tag is wrong: is it coming from the project module, the team module, or the platform module? A variable isn’t being passed: which layer dropped it? `terraform plan` output nests module paths three levels deep (`module.vpc.module.vpc.module.vpc.aws_vpc.this`), which is disorienting until you’ve seen it enough times.

### Version Matrix Complexity

Each layer has its own version. Project modules pin a version of the team module, which pins a version of the platform module. When the platform team ships a breaking change, the upgrade chain is: platform module new version → team module tests and bumps its platform pin → publishes a new team module version → projects test and bump their team module pin. That’s three coordinated releases for one underlying change. At small scale this is overhead. At large scale it’s necessary governance.

### Over-abstraction Risk

The hierarchy works when the abstraction layers are well-designed. If the team module exposes too few variables, project engineers hit walls: the module does almost what they need but not quite, and there’s no way to customise it. They either fork the module (defeating the purpose) or open a request to the team module owners and wait. Getting the variable surface area right at each layer is the hard design problem, and it’s usually discovered through friction rather than upfront planning.

### Cognitive Distance from Resources

In a flat module, an engineer can read the module source and understand exactly what gets deployed. In a three-tier hierarchy, understanding what a project module actually creates requires reading three separate codebases. Engineers working only at the project level may have a limited mental model of the actual AWS resources being provisioned.

---

## Comparison

| Dimension                   | Flat Module                      | Nested Hierarchy                    |
| --------------------------- | -------------------------------- | ----------------------------------- |
| **Standards enforcement**   | Documentation, trust             | Hardcoded in higher layers          |
| **Blast radius of changes** | All callers affected immediately | Isolated by layer version pins      |
| **Project config size**     | Full variable set                | Only project-unique variables       |
| **Debugging**               | One layer deep                   | Three layers deep                   |
| **Version management**      | One version per module           | Version per layer, upgrade chain    |
| **Flexibility at project**  | Full control                     | Limited to what team module exposes |
| **Right for**               | Small teams, single ownership    | Platform teams serving many teams   |

---

## When to Add a Layer

Adding a module tier makes sense when:

- A distinct team owns and gates changes to that layer (platform team, not just a shared folder)
- The layer encapsulates decisions that every downstream consumer should inherit without thinking about them
- The upgrade cycle between layers needs to be decoupled - platform ships on their cadence, teams consume on theirs

Adding a layer for the sake of organisation, without the ownership and decoupling benefits, just adds indirection. A well-factored flat module is better than a poorly justified hierarchy.

---

## Closing Thoughts

Flat modules solve the DRY problem. Nested hierarchies solve the governance and decoupling problem. The single module I was writing before my current organization was the right tool for a single team owning all the infrastructure. The three-tier hierarchy at my current organization was the right tool for a platform team that needed to enforce organisation-wide standards while letting individual teams move at their own pace.

The cost is real: debugging gets harder, version management gets more complex, and the abstraction can hide too much if the variable surfaces aren’t designed carefully. But when a platform team needs confidence that every project is tagging resources correctly, enabling the right security controls, and not diverging from architectural standards, the hierarchy earns its complexity.

---

### Further Reading

- [Terraform module documentation](https://developer.hashicorp.com/terraform/language/modules) - official reference for module sources, version constraints, and input/output patterns
- [Terraform module composition](https://developer.hashicorp.com/terraform/language/modules/develop/composition) - HashiCorp’s own guidance on when to nest modules and when to keep them flat
- [Terraform Registry module publishing](https://developer.hashicorp.com/terraform/registry/modules/publish) - requirements and process for publishing versioned modules to a registry, which is the right distribution mechanism for platform modules
