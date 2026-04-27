# Deployment Guide for VPS

Follow these exact steps to host this IPTV app on your VPS and point `https://iptv.ifastx.in` to it.

## Prerequisites

1. A VPS running **Ubuntu 20.04 or 22.04**.
2. DNS A-Record for `iptv.ifastx.in` pointing to your VPS public IP address.
3. Access to your server via SSH.

---

## Step 1: System Preparation

Log in to your VPS via SSH and run the following commands to install Node.js, Nginx, and Git.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx unzip

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 and tsx globally (for running your app in the background)
sudo npm install -g pm2 tsx
```

---

## Step 2: Upload Application Files

Create a directory for your application and give your user ownership:

```bash
sudo mkdir -p /var/www/iptv.ifastx.in
sudo chown -R $USER:$USER /var/www/iptv.ifastx.in
cd /var/www/iptv.ifastx.in
```

**Upload your files** to this folder. You can do this via SFTP (FileZilla), SCP, or by pushing your code to GitHub and cloning it. Make sure all the files (including `package.json`, `server.ts`, `src/` folder) are inside `/var/www/iptv.ifastx.in`.

---

## Step 3: Install Dependencies & Build Frontend

Once your files are uploaded to the VPS, install the required packages and build the React frontend:

```bash
cd /var/www/iptv.ifastx.in

# Install all node_modules
npm install

# Build the frontend (Compiles React to the dist/ folder)
npm run build
```

---

## Step 4: Start the Server Background Process

We use PM2 to make sure your Node.js backend (`server.ts`) stays running even after you disconnect from SSH, and automatically boots on a server restart.

```bash
# PM2 needs to know how to interpret tsx
pm2 start "npx tsx server.ts" --name "iptv-app"

# Save the PM2 list and configure it to start on server boot
pm2 startup
# (Run the command PM2 gives you in output, then run the next line)
pm2 save
```

*Your application is now running locally on your VPS on port 3000.*

---

## Step 5: Configure Nginx Reverse Proxy

Now, we will route traffic coming from the outside world (port 80) into your Node server (port 3000).

1. Create a new configuration file:
```bash
sudo nano /etc/nginx/sites-available/iptv.ifastx.in
```

2. Paste the following configuration:
```nginx
server {
    listen 80;
    server_name iptv.ifastx.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*(Save and exit by pressing `CTRL+X`, then `Y`, then `Enter`)*

3. Enable the Nginx site:
```bash
sudo ln -s /etc/nginx/sites-available/iptv.ifastx.in /etc/nginx/sites-enabled/

# Test Nginx for syntax errors
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 6: Secure your site with HTTPS (SSL)

To enable `https://` so your app traffic is secure and webhooks work, use Certbot.

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install the SSL certificate
sudo certbot --nginx -d iptv.ifastx.in
```

Follow the on-screen prompts to register your email and accept terms. When asked, choose to redirect all HTTP traffic to HTTPS.

---

## Step 7: Final Check

Visit **https://iptv.ifastx.in** in your browser. 
Your IPTV App should now be fully functional on your domain!

**Note for Telegram Webhooks:**
If you want to configure a Telegram bot to call your API webhook for syncing:
`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://iptv.ifastx.in/api/webhook/telegram`
