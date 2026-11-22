# Blocking Direct IP Access to NGINX

> Protection of direct access to NGINX IP address, minimizing the risk of unauthorized intrusion.

- Type: Post
- Published: 2024-04-06
- Tags: linux, security
- Source: https://irfanadziri.dev/posts/blocking-direct-ip-access-to-nginx/

---

When setting up NGINX as a web server or a reverse proxy server, oftentime we do not need the public to have direct access to the server’s IP address. To achieve this, we need to block the connection to the IP and return empty response to the client.

## Why Blocking Direct Access to IP Address is Considered?

1. Exposing server’s IP address publicly can be a security risk. By restricting access only through domain names, extra layer of protection is added. Attackers attempting unauthorized access might not know the specific domain names configured on the server, making it harder for them to exploit vulnerabilities.
2. This also ensures that users reach the intended website based on the domain name they use (assuming the NGINX is hosting many sites). This prevents unexpected behavior or unauthorized access to other websites hosted.

---

## Default Server

This settings can be configured using NGINX configuration files by adding this line in the server block:

```
server {
    listen      80 default_server;
    listen      [::]:80 default_server;

    server_name _;
    return      444;
}
```

With this configuration, the NGINX will catch all request made to default server without domain (if there is no matching request to virtual host), then it will block all of them by closing the connection.

## Virtual Host

Then add this to virtual host as well to allow the request only to correct domain:

```
server {
    if ( $host != "domain.com" ){
        return 444;
    }
}
```

**Note**: This will not work when you setup the NGINX as a reverse proxy, then need to **made request to the server using its IP address**. This config will block all incoming request made to its IP and not from its domain setup in virtual host.
