# Secure SSH Access Through a Bastion Host Without Storing the Private Key

> Learn how to securely SSH into a private target server through a bastion host by forwarding private key using SSH agent forwarding, avoiding key exposure on the bastion host.

- Type: Post
- Published: 2024-10-07
- Tags: ssh, security
- Source: https://irfanadziri.dev/posts/ssh-into-a-target-server-via-a-bastion-host-without-storing-the-pem-key/

---

It’s common to use a **bastion host** (or jump host) to SSH into private internal servers when working with secure infra environment. Some users may copy their private SSH key (`.pem` file) to the bastion host using `scp -i` for convenience, such as:

```bash
scp -i /path/to/private-key.pem /path/to/private-key.pem user@host-public-ip:~/
```

However, storing the key on the bastion host is not secure and increases the risk of key exposure to the public, moreover the bastion host is accessible publicly. A more secure approach is to use **SSH agent forwarding**, which allow users to forward the private key from local machine >> bastion >> target server, without ever storing the key on the bastion host.

Here’s a simple step-by-step guide, securely forwarding `.pem` key:

## Step 1: Load the Private Key on Local Machine

1. Open terminal on local machine.

2. Add the private key to the SSH agent:

   ```bash
   ssh-add /path/to/private-key.pem
   ```

   - Replace `/path/to/private-key.pem` with the correct file and path of private key.

This ensures the key is available for authentication in the next steps.

## Step 2: SSH into the Bastion Host with Agent Forwarding

1. Run this from local machine:

   ```bash
   ssh -i /path/to/private-key.pem -A user@bastion-host-public-ip
   ```

   - Replace `/path/to/private-key.pem` with the correct file and path of private key.
   - Replace `user` with the correct username for the bastion host.
   - Replace `bastion-host-public-ip` with the actual public IP of the bastion host.

By using the `-A` flag, the SSH agent is now forwarded to the bastion host, but the private key remains securely on local machine.

## Step 3: SSH into the Target Server from the Bastion Host

1. From the bastion host, run the command:

   ```bash
   ssh user@target-server-private-ip
   ```

   - Replace `user` with the correct username for the target server.
   - Replace `target-server-private-ip` with the actual private IP of the target server.

Since the SSH agent is forwarded, the bastion will use the local key for authentication with the target server, without needing the `.pem` file on the bastion host.
