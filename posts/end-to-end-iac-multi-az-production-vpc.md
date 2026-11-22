# E2E IaC for Multi-AZ Production VPC

> A practical walkthrough of the three foundational decisions in a production-grade VPC: the public/private subnet pattern, NAT strategy tradeoffs, and where to place ALB.

- Type: Post
- Published: 2025-07-24
- Tags: aws, networking, cost
- Source: https://irfanadziri.dev/posts/end-to-end-iac-multi-az-production-vpc/

---

Spinning up a VPC is a few clicks in the console. Building one that survives production traffic, a security audit, and a cost review six months later is a different problem entirely. This article focuses on the three structural decisions that determine everything else: (1) how to split public and private subnets, (2) how to handle outbound internet for private resources, and (3) where the load balancer sits.

All examples use Terraform, but the logic applies equally to CloudFormation, CDK, or Pulumi.

---

## 1. Public/Private Subnet Pattern

The single most important architectural decision in a VPC is which resources get a route to the internet gateway and which do not. Getting this wrong is easy to detect in theory and surprisingly hard to fix in production.

### The Core Rule

A **public subnet** has a route to an Internet Gateway (IGW) in its route table. A **private subnet** does not. That is the only meaningful distinction: “public” and “private” are not AWS concepts, they are naming conventions for route table configurations.

```hcl
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  # no default route: this is what makes it private
}
```

### Multi-AZ Layout

A production VPC spans at least two AZs. Three is better because some AWS services (RDS Multi-AZ, EKS managed node groups) benefit from odd-numbered AZ counts for quorum. Each AZ gets its own public subnet and its own private subnet.

```hcl
locals {
  azs             = ["ap-southeast-5a", "ap-southeast-5b", "ap-southeast-5c"]
  public_cidrs    = ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]
  private_cidrs   = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
}

resource "aws_subnet" "public" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.public_cidrs[count.index]
  availability_zone = local.azs[count.index]

  map_public_ip_on_launch = true

  tags = { Name = "public-${local.azs[count.index]}" }
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_cidrs[count.index]
  availability_zone = local.azs[count.index]

  map_public_ip_on_launch = false

  tags = { Name = "private-${local.azs[count.index]}" }
}
```

### What Goes Where

| Layer                                   | Subnet                                  | Why                                                              |
| --------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| ALB (internet-facing)                   | Public                                  | Needs a public IP to receive traffic from the internet           |
| EC2 app servers / ECS tasks             | Private                                 | No direct inbound exposure; ALB forwards to them                 |
| RDS, ElastiCache, OpenSearch            | Private                                 | No inbound internet path, ever                                   |
| NAT Gateway                             | Public                                  | Needs an Elastic IP and IGW route to forward private traffic out |
| Bastion / EC2 Instance Connect Endpoint | Public (or none, if using EIC endpoint) | Needs reachability for SSH                                       |

The common mistake is placing EC2 app instances in public subnets because “they need outbound internet for package updates.” They do not need a public subnet. They need a NAT Gateway in a public subnet. The instance itself should stay private.

### CIDR Planning

Reserve more space than presumably needed. A `/24` gives 251 usable IPs (AWS reserves 5 per subnet). For private subnets hosting ASGs or EKS node groups, a `/22` or larger is safer. EKS assigns a secondary ENI per pod in the default VPC CNI mode, which can exhaust a `/24` with a handful of nodes.

A practical starting layout for a production VPC:

```
10.0.0.0/16   # VPC supernet
  10.0.0.0/24   # public-ap-southeast-5a
  10.0.1.0/24   # public-ap-southeast-5b
  10.0.2.0/24   # public-ap-southeast-5c
  10.0.10.0/22  # private-ap-southeast-5a  (1019 IPs)
  10.0.14.0/22  # private-ap-southeast-5b
  10.0.18.0/22  # private-ap-southeast-5c
  10.0.100.0/24 # reserved for future database subnet tier
```

---

## 2. NAT Strategy Tradeoffs

Private subnet resources that need outbound internet access (pulling packages, calling external APIs, reaching AWS services without VPC endpoints) require a path out. There are three options (at least in my knowledge), each with a different cost and availability profile.

### Option A: NAT Gateway (Managed)

The standard choice for production. AWS manages the NAT device, it scales automatically, and it is highly available within a single AZ.

```hcl
resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = length(local.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = { Name = "nat-${local.azs[count.index]}" }
}

resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
}
```

The critical detail: **one NAT Gateway per AZ, each private subnet routes to its own AZ’s NAT Gateway**. A single shared NAT Gateway is a single point of failure and creates cross-AZ data transfer charges on every outbound byte from the other AZs.

**Cost:** $0.05/hour per NAT Gateway (\~$36/month each). Three NAT Gateways for three AZs = \~$108/month before any traffic and data processing.

### Option B: NAT Instance (Self-Managed)

A regular EC2 instance with `Source/destination check` disabled and iptables configured for masquerading. Cheaper, but it needs own patching, HA, and failover setup.

```hcl
resource "aws_instance" "nat" {
  ami                    = data.aws_ami.nat.id  # community NAT AMI or fck-nat
  instance_type          = "t4g.nano"
  subnet_id              = aws_subnet.public[0].id
  source_dest_check      = false
  vpc_security_group_ids = [aws_security_group.nat.id]
}
```

The `fck-nat` project provides a maintained ARM64 AMI with HA support via an Auto Scaling group of size 1. For low-traffic environments or cost-sensitive workloads, a `t4g.nano` NAT instance at \~$3/month is hard to argue against.

**When to use:** Dev/staging environments, workloads with low egress volume, teams with the operational capacity to manage it.

**When not to use:** High-throughput production workloads where NAT instance bandwidth caps (constrained by instance size) become a bottleneck.

### Option C: VPC Endpoints (Avoid NAT Entirely)

For AWS service traffic, a VPC endpoint eliminates the NAT Gateway entirely. Gateway endpoints for S3 and DynamoDB are free. Interface endpoints for other services (SSM, Secrets Manager, ECR, SQS, etc.) cost \~$0.01/hour per AZ but are cheaper than NAT Gateway data charges at volume.

```hcl
# Free: no per-GB charge, no hourly charge
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id
}

# Interface endpoint: hourly charge, but eliminates NAT for SSM traffic
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
}
```

**Practical recommendation:** Deploy gateway endpoints for S3 and DynamoDB unconditionally: they cost nothing and reduce NAT Gateway data processing charges immediately. Evaluate interface endpoints for any service that generates significant traffic through the NAT Gateway (audit the `BytesProcessed` CloudWatch metric on the NAT Gateways after a week of production traffic).

### Decision Matrix

| Scenario                               | Recommended NAT Strategy                                        |
| -------------------------------------- | --------------------------------------------------------------- |
| Production, high availability required | NAT Gateway, one per AZ                                         |
| Production, cost is a constraint       | NAT Gateway for critical paths + VPC endpoints for AWS services |
| Dev/staging, low traffic               | Single NAT Gateway or fck-nat instance                          |
| Workloads that only call AWS services  | VPC endpoints only, no NAT needed                               |
| Egress-heavy (video, large payloads)   | NAT Gateway + audit with Cost Explorer                          |

---

## 3. ALB Placement: Public vs Private

The Application Load Balancer sits at the entry point of the request path. Where it placed determines who can reach the application and how traffic flows through the VPC.

### Internet-Facing ALB (Public Subnets)

The standard pattern for any application serving external users. The ALB receives a public DNS name and public IP addresses, sits in the public subnets, and forwards to targets in private subnets.

```hcl
resource "aws_lb" "public" {
  name               = "app-alb-public"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_public.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true
}

resource "aws_security_group" "alb_public" {
  name   = "alb-public"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
}
```

The target group points at instances or ECS tasks in private subnets. The app security group should allow inbound **only from the ALB security group**, not from `0.0.0.0/0`:

```hcl
resource "aws_security_group_rule" "app_from_alb" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb_public.id
  security_group_id        = aws_security_group.app.id
}
```

This means an attacker who discovers the EC2 instance IP cannot bypass the ALB: the security group will drop any connection not sourced from the ALB.

### Internal ALB (Private Subnets)

An internal ALB (`internal = true`) receives only a private DNS name and is reachable only within the VPC (or connected networks via VPN/Direct Connect). Use this for:

- Service-to-service communication between microservices
- APIs consumed only by other internal systems
- A second-tier load balancer in a layered architecture (external ALB → internal ALB → service)

```hcl
resource "aws_lb" "internal" {
  name               = "app-alb-internal"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_internal.id]
  subnets            = aws_subnet.private[*].id
}
```

The internal ALB lives in private subnets. Its security group allows inbound from whatever sources are legitimate callers (other security groups, specific CIDR ranges from connected networks).

### Layered Pattern: Public ALB + Internal ALB

For applications with a public frontend and internal microservices, a two-tier ALB pattern isolates the trust boundaries cleanly:

```
Internet
  ↓
Public ALB (public subnets, SG: allow 443 from 0.0.0.0/0)
  ↓
Frontend EC2/ECS (private subnets, SG: allow from public ALB only)
  ↓
Internal ALB (private subnets, SG: allow from frontend SG only)
  ↓
Backend services (private subnets, SG: allow from internal ALB only)
  ↓
RDS (private subnets, SG: allow from backend SG only)
```

Each hop enforces its own security group rule. Lateral movement requires compromising each layer’s security group in sequence.

### ALB and ACM Certificates

For HTTPS, ACM certificates are attached to the ALB listener, not to the instances. The ALB terminates TLS and forwards HTTP (or HTTPS if E2E encryption is required) to the targets.

```hcl
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.public.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.public.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

Use `ELBSecurityPolicy-TLS13-1-2-2021-06`: it enforces TLS 1.2 minimum and prefers TLS 1.3. Avoid the older `ELBSecurityPolicy-2016-08` policy that still allows TLS 1.0 and 1.1.

### When to Use a Private ALB Without a Public One

If the application is accessed exclusively through a corporate VPN, AWS Client VPN, or Direct Connect, and never from the public internet, deploy only a private internal ALB. There is no reason to expose a public endpoint that is then locked down at the WAF layer. **Simpler is more secure**.

---

## Putting It Together

A complete multi-AZ production VPC has:

- A `/16` CIDR with room for future subnet tiers
- Three public subnets (one per AZ) for the ALB and NAT Gateways
- Three private subnets (one per AZ, `/22` or larger) for application workloads
- Three NAT Gateways (one per AZ), each with its own Elastic IP
- Private route tables that direct `0.0.0.0/0` to the AZ-local NAT Gateway
- Gateway VPC endpoints for S3 and DynamoDB
- An internet-facing ALB in public subnets, forwarding to targets in private subnets
- Security groups that chain: ALB → app → database, with no `0.0.0.0/0` on app or database tiers

The three decisions (subnet layout, NAT strategy, and ALB placement) are not independent. An internal ALB in public subnets is a misconfiguration. A NAT Gateway in a private subnet cannot route outbound traffic. A single shared NAT Gateway across all AZs is both a reliability risk and a hidden cost driver. Getting the three right together is what makes the VPC production-grade.

### Further Reading

- [AWS VPC User Guide](https://docs.aws.amazon.com/vpc/latest/userguide/) - Authoritative reference for all VPC primitives
- [fck-nat](https://fck-nat.dev/) - Cost-effective NAT instance alternative with HA support
- [AWS NAT Gateway pricing](https://aws.amazon.com/vpc/pricing/) - Data processing charges are the surprise line item
- [ALB security policies](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-https-listener.html#describe-ssl-policies) - TLS policy reference for ALB listeners
