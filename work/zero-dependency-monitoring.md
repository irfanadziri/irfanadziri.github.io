# Monitoring with zero dependencies

> A dependency-free Python monitoring service that polls a hypervisor at measured intervals and streams live status to a dashboard over a private mesh network.

- Type: System doc
- Domain: observability
- Stack: proxmox, python stdlib, sse, tailscale, systemd
- Source: https://irfanadziri.dev/work/zero-dependency-monitoring/

---

**Figure 05: Zero-dependency monitoring.** Diagram: a tiered poller written with only the Python standard library reads the Proxmox API with a read-only token and streams updates over server-sent events, with O(1) fan-out, to a live dashboard reachable only over the private mesh.

Installing Grafana and Prometheus for one hypervisor is solving a one-node problem with a fleet-sized tool. I built the monitoring instead: a single Python service using nothing outside the standard library, polling the hypervisor’s API and streaming the result over server-sent events to a hand-written dashboard with inline SVG charts. No pip, no npm, no build step, and no third-party request ever leaves the page. Even the fonts are self-hosted.

## Polling at the rate the data actually changes

Before picking a polling interval I measured one. The cluster-resources endpoint changed twice across eleven one-second polls (roughly ten seconds of real lag), so sourcing live CPU and memory readings from that endpoint would have meant a dashboard that lies about being live. Per-guest status gets polled every two seconds because it actually updates that often; cluster-wide data every five; the guest agent every thirty; disk health every sixty. One background thread owns all of it, and every connected client reads the same in-memory snapshot, so the number of people watching the dashboard never changes the load on the hypervisor.

## What it’s allowed to touch

The poller authenticates with a Proxmox API token scoped to the read-only auditor role, stored in a file only root can read. The server binds to the Tailscale overlay address only (not the LAN interface, not every interface), so the dashboard is unreachable from anywhere except the mesh, which is the lab’s only remote-access path in the first place. A systemd unit starts it after the mesh comes up and restarts it on failure.

## What the uptime actually proves

The lab has run since 2024, and the current stretch of continuous uptime dates from a restart in December 2025, on hardware I administer alone. The dashboard hasn’t needed a rewrite in that time, which is the strongest argument I have that sizing the tool to the problem, rather than reaching for whatever a bigger team would reach for, was the right call here.

## Limits

It’s built for exactly one node. Everything lives in one Python process holding one in-memory snapshot, so it has no redundancy of its own: if the service or the host goes down, the view of it goes with it, and systemd restarting the unit is the whole recovery story. It’s reachable only over the mesh, which suits a lab with one operator and wouldn’t suit a team.
