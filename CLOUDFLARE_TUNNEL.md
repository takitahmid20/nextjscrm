# 🌐 Exposing SaaS CRM Dashboard via Cloudflare Tunnel (`cloudflared`)

This guide provides step-by-step instructions for utilizing Cloudflare Tunnels (formerly Argo Tunnel) to securely connect your locally-running Next.js SaaS CRM (port `3000`) directly to the public web through the Cloudflare edge without opening any incoming firewall ports on your server.

---

## ⚡ Quick Start: One-Time Ad-Hoc Public Tunnel

If you want to immediately generate a temporary public URL for testing without creating a Cloudflare account, run the following command on your hosting server/local machine where the app is running:

```bash
npx untun@latest dev 3000
```
*Or with Cloudflare CLI directly:*
```bash
cloudflared tunnel --url http://localhost:3000
```
This generates a random public hostname (e.g., `https://some-random-word.trycloudflare.com`) that routes traffic directly and securely to your local port `3000`.

---

## 🔒 Production Setup: Persistent Cloudflare Tunnel

To map this CRM to your custom domain (e.g., `crm.yourdomain.com`) with automated SSL, DDoS protection, and maximum security, follow these instructions:

### Step 1: Install the Cloudflare Daemon (`cloudflared`)

Install `cloudflared` on your system or server:
* **macOS**: `brew install cloudflare/cloudflare/cloudflared`
* **Linux (Ubuntu/Debian)**:
  ```bash
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```
* **Windows**: Download the `.exe` binary from Cloudflare's GitHub and add it to your system PATH.

### Step 2: Authenticate Cloudflare Daemon

Link your server's CLI tool to your Cloudflare account profile:
```bash
cloudflared tunnel login
```
*This opens a browser window prompting you to authorize your Cloudflare domain zone.*

### Step 3: Create the Named Tunnel

Create a dedicated tunnel for your CRM platform:
```bash
cloudflared tunnel create saas-crm-tunnel
```
**Example Output:**
```text
Created tunnel saas-crm-tunnel with UUID 8c4fa56d-4ee1-4560-b778-9f170f03c09e
```
*Note down the **Tunnel UUID** and the generated path to the credentials JSON file.*

### Step 4: Configure the Tunnel Configuration

Create a `config.yml` file in the cloudflared directory (typically `~/.cloudflared/config.yml` or `/etc/cloudflared/config.yml`):

```yaml
tunnel: 8c4fa56d-4ee1-4560-b778-9f170f03c09e
credentials-file: /root/.cloudflared/8c4fa56d-4ee1-4560-b778-9f170f03c09e.json

ingress:
  # Route traffic matching your custom domain to local Next.js on port 3000
  - hostname: crm.yourdomain.com
    service: http://localhost:3000
  # Catch-all rule returning a 404 for unmapped requests
  - service: http_status:404
```

### Step 5: Route Public DNS to Your Tunnel

Create a CNAME record in your Cloudflare DNS dashboard pointing your desired hostname to the tunnel connector:
```bash
cloudflared tunnel route dns saas-crm-tunnel crm.yourdomain.com
```

### Step 6: Start and Run the Tunnel Service

Test execution in the foreground:
```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run
```
To run the tunnel permanently in the background as a system-level daemon:
```bash
# Install the system service
sudo cloudflared service install

# Enable and boot the service
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## 🐳 Optional: Run via Docker Compose

If you are running the CRM using containers, attach a Cloudflare Tunnel sidecar context inside a `docker-compose.yml` manifest:

```yaml
version: "3.8"

services:
  crm-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=your_gemini_api_key

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=your_cloudflare_tunnel_token_here
    restart: unless-stopped
    depends_on:
      - crm-app
```
