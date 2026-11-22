# Homelab

> One Proxmox node that runs my apps, my dev machine and my agents, reachable only over a Tailscale mesh, with nothing exposed to the internet.

- Type: Homelab
- Source: https://irfanadziri.dev/homelab/

---

The homelab is where I run what I build for myself, and where I try things before I’d do them for anyone else. It has run since October 2024 on one machine that I administer alone.

## Topology

**One node, one way in. Labels are generic on purpose: no addresses, hostnames or versions..** My laptop and phone connect to the Tailscale mesh, which is the only way into the lab. The mesh reaches a single Proxmox node. On that node run self-hosted apps in LXC containers, the dev VM I write code on, agent and automation workloads, the monitoring dashboard and a Proxmox Backup Server. The apps, the dev VM and the agents are backed up to that backup server. A dashed edge from the internet to the node is marked blocked: there are no open ports.

One Proxmox hypervisor runs everything. Small services and apps live in LXC containers, because a container costs a fraction of a VM’s memory. The machine I develop on is a full VM, so it behaves like any other Linux server. Agent and automation workloads, and the dashboard that watches the node, run beside them.

## Access model

**Tailscale-only access. No WAN exposure.** That’s the design rule, and everything else follows from it.

1. A device of mine joins the tailnet with its own identity.
2. The mesh routes it to the node, which nothing outside the house can otherwise reach.
3. The router forwards no ports. There is no public IP to scan and no login page facing the internet.

The reasoning is about who can knock. A lab run by one person, in spare hours, will lag behind on patches; anything reachable from the internet will eventually meet that gap. With no open ports, an unpatched service is still a problem, but only for devices I already trust.

It’s also why analytics for this site is a hosted service rather than something on the lab: self-hosting it would have meant opening a port.

## Backups

Proxmox Backup Server takes backups of the guests: the app containers, the dev VM and the agent workloads. I have restored a guest from it, so the backups are known to restore, not just known to run.

## Monitoring

The node is watched by a monitoring service I wrote with nothing but the Python standard library, reachable only over the mesh. How it works, and why it isn’t Grafana, is written up as a system doc: [Monitoring with zero dependencies](https://irfanadziri.dev/work/zero-dependency-monitoring/).

## What this isn’t, and what I’d change

It isn’t highly available. There is one node, so a hardware fault stops everything until I fix it, and nothing fails over. It’s a lab, and that trade is fine for a lab.

The backups are the weak point, and I know it. Proxmox Backup Server runs on the same node it protects, so a dead disk or a dead machine takes the backups with it. They cover mistakes, a broken upgrade or a deleted container, not hardware loss. The first change I’d make is a second copy off the node: a sync to another box or to object storage, so one failure can’t remove both the guests and their backups.
