# Simplifying Git Authentication with Credential Helpers

> Simplifying Git authentication using credential helpers for HTTPS-cloned repositories, but with a catch.

- Type: Post
- Published: 2024-08-07
- Tags: tooling, security
- Source: https://irfanadziri.dev/posts/simplifying-git-authentication-with-credential-helpers/

---

Managing Git credentials can be a hassle if entering them every time there is interaction with a remote repository cloned via HTTPS. Thankfully, Git offers credential helpers to make this easier. Here’s how to use them:

## 1. Store Credentials Permanently

Use the following command to save credentials in a plain text file on the disk. This means no need to enter them again.

```bash
git config --global credential.helper store
```

## 2. Cache Credentials Temporarily

This command caches credentials in memory for 15 minutes (default). It’s a safer option than storing them in plain text.

```bash
git config --global credential.helper cache
```

## 3. Extend Cache Duration

To cache credentials for a longer period, such as one hour, use this command:

```bash
git config --global credential.helper 'cache --timeout=3600'
```

**Note**: These commands need to be used before the system is prompting for github credentials.

## 4. View Stored Credential

To view stored/cached credential, simply use this command:

```bash
cat ~/.git-credentials
```

Example output would be like this: `https://username:password@github.com`

## 5. Clear Stored Credential

To clear stored/cached credential, simply use this command:

```bash
rm ~/.git-credentials # To remove saved credential on disk
git credential-cache exit # To remove saved credential on memory by restarting the daemon
```

**⚠️ Warning**: While using Git credential helpers can simplify the workflow, it is important to note that these methods are not the most secure. Storing credentials in plain text or caching them in memory can expose sensitive information. For enhanced security, consider cloning repositories using SSH or create fine-grained access token in GitHub.

## Conclusion

Using Git credential helpers can make the workflow smoother for repositories cloned via HTTPS. Choose `store` for simplicity, `cache` for better security, or extend the cache duration for longer sessions. For enhanced security and a seamless experience, consider using SSH keys.
