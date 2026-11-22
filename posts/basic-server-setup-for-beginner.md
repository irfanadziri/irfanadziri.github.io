# Basic Server Setup for Beginner

> Automate the installation/configuration of LAMP stack in a new ubuntu setup. Great for beginner to setup basic monolith web server.

- Type: Post
- Published: 2024-01-13
- Tags: linux
- Source: https://irfanadziri.dev/posts/basic-server-setup-for-beginner/

---

## Tutorial for beginners to deploy a basic web server with LAMP stack. (below 5 minutes)

**Pre-requisite**: have a newly setup linux server with **Debian-based** OS such as Ubuntu. If you’ve installed other than Debian-based, please use their respective package manager.[1](#user-content-fn-1)

1. Update and upgrade packages: `sudo apt update && sudo apt upgrade -y`
2. Install web server: `sudo apt install apache2 -y`
3. Install mySQL client and server: `sudo apt install mysql-client mysql-server -y`
4. Harden the mySQL installation:[2](#user-content-fn-2) `sudo mysql_secure_installation`
5. Install PHP and its module:[3](#user-content-fn-3) `sudo apt install php libapache2-mod-php php-mysql php-common -y`
6. Start and enable auto-start the web server: `sudo systemctl start apache2 && sudo systemctl enable apache2`
7. Start and enable auto-start the mySQL server: `sudo systemctl start mysql && sudo systemctl enable mysql`
8. Check server status: `sudo systemctl status apache2 && sudo systemctl status mysql`
9. Allow incoming request to server: `sudo ufw allow in "Apache Full"`
10. Test the server by visiting http\://\<server-ip>/

## Want to automate this process using a script?

1. Copy the script below

```bash
#!/bin/bash

sudo apt update && sudo apt upgrade -y
sudo apt install apache2 -y
sudo apt install mysql-client mysql-server -y
sudo mysql_secure_installation
sudo apt install php libapache2-mod-php php-mysql php-common -y
sudo systemctl start apache2 && sudo systemctl enable apache2
sudo systemctl start mysql && sudo systemctl enable mysql
sudo systemctl status apache2 && sudo systemctl status mysql
sudo ufw allow in "Apache Full"

echo "LAMP setup complete!"
```

2. Save as `Setup.sh`
3. Make it executable: `sudo chmod +x Setup.sh`
4. Run it: `sudo ./Setup.sh`

1) Substitute `apt` to `yum` for Redhat-based and `pacman` for Arch-based. [↩](#user-content-fnref-1)

2) This is optional to secure the database setup. During the process, you’ll be prompted a series of questions. [↩](#user-content-fnref-2)

3) This is just basic module needed as for basic installation, as the app grows, there will be additional module needed. [↩](#user-content-fnref-3)
