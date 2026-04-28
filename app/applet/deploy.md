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
sudo apt install -y curl git unzip

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

**Note about Port 3000 Conflict:** You asked if port `3000` conflicts with your other VPS (`wa-api.ifastx.in` on `192.168.15.201:3000`). **No, it does not conflict.** Ports are separate for every device/VPS. Port `3000` on `.206` is completely independent of port `3000` on `.201`. They will not interfere with each other.

```bash
# 1. Add a proper "start" script to your package.json
npm pkg set scripts.start="NODE_ENV=production npx tsx server.ts"

# 2. Start the app using the new start script
pm2 start npm --name "iptv-app" -- run start

# 3. Save the PM2 list and configure it to start on server boot
pm2 startup
# (Run the command PM2 gives you in output, then run the next line)
pm2 save
```

*Your application is now running locally on your VPS on port 3000 in Production mode.*

---

## Step 5: Configure Reverse Proxy (Nginx Proxy Manager)

Since you are running your **FileStreamBot on port 8080** and this new **IPTV App on port 3000**, you should use **two separate subdomains** in Nginx Proxy Manager to avoid path conflicts.

For example:
- **`stream.ifastx.in`** ➔ Forwards to FileStreamBot (`192.168.15.206:8080`)
- **`iptv.ifastx.in`** ➔ Forwards to this new Web App (`192.168.15.206:3000`)

### How to set this up in NPM:

**1. Point `iptv.ifastx.in` to the New Web App (Port 3000)**
* Open Nginx Proxy Manager.
* Edit your existing `iptv.ifastx.in` proxy host.
* Change the **Forward Port** from `8080` to `3000`.
* Enable **Websockets Support**.
* Click **Save**.

**2. Point a new subdomain (e.g., `stream.ifastx.in`) to FileStreamBot (Port 8080)**
* In Nginx Proxy Manager, click **Add Proxy Host**.
* **Domain Names:** `stream.ifastx.in` *(Make sure you created a DNS A-Record for this!)*
* **Forward IP:** `192.168.15.206`
* **Forward Port:** `8080`
* **Advanced Tab (Custom Nginx):** Move your custom video buffering/timeout settings here, because *this* is the one handling heavy video files.
  ```nginx
  proxy_buffering off;
  proxy_request_buffering off;
  add_header Accept-Ranges bytes;
  proxy_hide_header Content-Disposition;
  add_header Content-Disposition "inline";
  proxy_read_timeout 86400s;
  proxy_send_timeout 86400s;
  proxy_connect_timeout 300s;
  ```
* **SSL Tab:** Select **"Request a new SSL Certificate"**, enable **"Force SSL"**, agree to the terms, and click **Save**. (NPM manages the SSL automatically).

**3. Update your FileStreamBot `.env` config**
Now that FileStreamBot is on `stream.ifastx.in`, you need to edit its configuration file (`.env` or `config.py`) so it generates the correct links:
```text
URL=https://stream.ifastx.in/
```
*(Remove the `:8080` and use the new subdomain instead so videos load properly over secure HTTPS!)*
Restart your FileStreamBot after changing this.

---

## Step 6: Mikrotik Router Verification

Ensure your Mikrotik router is port forwarding ports `80` and `443` from your public Static IP to the local IP of the server hosting **Nginx Proxy Manager** (not this specific app's VPS). Since you already have other domains working, this is likely already set up correctly.

---

## Step 7: Final Check

Visit **https://iptv.ifastx.in** in your browser. 
Your IPTV App should now be fully functional on your domain!

**Note for Telegram Webhooks:**
If you want to configure a Telegram bot to call your API webhook for syncing:
`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://iptv.ifastx.in/api/webhook/telegram`
