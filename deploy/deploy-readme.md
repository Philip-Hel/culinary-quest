# Deploying Culinary Quest to your Windows Home Server (HTTPS via Caddy)

This turns Culinary Quest into a server that runs on a **Windows home server**
and is reachable over **HTTPS at your own domain**, backed by the same approach
as the Trading Assistant project: a Node server on a LAN port, fronted by a
Caddy reverse proxy that provides a publicly-trusted Let's Encrypt certificate.

Culinary Quest is a **pure client-side app** — there is no backend or database,
so this deploy is simpler than Trading Assistant. The "server" just serves the
built `dist/` folder (`npm start` → `server.mjs` on port **5173**).

> These steps are performed **on the server**. Code is developed/pushed from
> your day-to-day PC (the git repo is the source of truth); the server only
> *runs* it.

---

## TL;DR

| Step | Where | What |
|---|---|---|
| 1 | Server | Install Node.js ≥ 20 + git, clone the repo |
| 2 | Server | Edit `deploy\Caddyfile` with your real domain |
| 3 | Server | `deploy\update-server.bat` (install, build, run on :5173) |
| 4 | Server (Firewall) | Allow inbound TCP **5173** (and 80/443 for the cert) on **Private** only |
| 5 | Server (DNS) | Point your domain at this server's IP (Cloudflare) |
| 6 | Server (Admin) | `deploy\install-caddy.bat` → builds/installs Caddy + auto cert |
| 7 | Server (Admin) | `deploy\install-caddy-auto-start.bat` (Caddy on boot) + `deploy\install-scheduled-task.bat` (app on boot) |

---

## 1. One-time server setup

1. Install **Node.js v20 or newer** from <https://nodejs.org>.
2. Install **Git** if not already present.
3. Clone the repo into a folder on the server, e.g. `D:\CulinaryQuest`:

   ```bat
   git clone https://github.com/Philip-Hel/culinary-quest.git "D:\CulinaryQuest"
   ```

4. **Edit `deploy\Caddyfile`**: replace `your-domain.com` with your real
   domain, and set your admin email after `email` in the top block. (This is the
   only file you need to touch for HTTPS.)

5. Build + start the app:

   ```bat
   deploy\update-server.bat   :: npm install, build, and starts the server on :5173
   ```

Confirm it works **on the server** at `http://localhost:5173`, and from another
device on your LAN at `http://<this-server-ip>:5173` (find the IP with `ipconfig`).

---

## 2. API keys (optional, but recommended)

Copy `install.bat`'s behaviour or create a local `.env` from `.env.example`:

```bat
copy .env.example .env
```

Then edit `.env` and add:
- `VITE_SPOONACULAR_API_KEY=...` — free key from <https://spoonacular.com>
- `VITE_DEEPSEEK_API_KEY=...` — paid key from <https://platform.deepseek.com/api_keys> (for "New AI idea")

These live only in the local `.env` (gitignored); `deploy\update-server.bat`
never touches it, so your keys and saved Recipe Book survive updates.

---

## 3. Firewall (LAN-only)

Open Windows Defender Firewall and add **inbound** rules:

- **Port 5173** (the app) — Profile **Private only**, Allow.
- If using **HTTP-01** cert method (see Caddyfile): also open **80** and **443**.
- If using **DNS-01** (Cloudflare, default): you do **not** need 80/443 inbound —
  the cert is issued via an API token, so nothing needs to reach the server
  from the internet.

---

## 4. DNS

Point your domain at this server's IP:

- In your DNS provider (e.g. Cloudflare): create an **A** record
  `your-domain.com  →  <this-server-IP>`.

If the cert is issued via **DNS-01** (default `Caddyfile`), you must have the
DNS on a **Cloudflare zone** and a Cloudflare **API token** with DNS *edit*
permission for it.

---

## 5. Install Caddy (admin)

Open **`deploy\install-caddy.bat`** as Administrator. It will:
1. Install Go if missing.
2. Build a Caddy binary that includes the **Cloudflare DNS plugin** (`xcaddy`).
3. Copy `deploy\Caddyfile` → `C:\Caddy\Caddyfile`.
4. Ask for your **Cloudflare API token** (DNS edit) — this is `CF_DNS_API_TOKEN`.
5. Start Caddy: **https://your-domain.com → localhost:5173**, auto-obtaining and
   renewing the Let's Encrypt cert.

> Using a different DNS provider? Comment out the `tls { dns ... }` block in the
> Caddyfile and instead open TCP 80/443 in the firewall — Caddy will use
> HTTP-01 and a normal DNS A record, no token needed.

---

## 6. Auto-start on boot (admin)

Register two tasks so everything comes back after a reboot:

```bat
deploy\install-scheduled-task.bat     :: starts npm start (the app) at boot
deploy\install-caddy-auto-start.bat   :: starts Caddy (the proxy) at boot
```

---

## Updating the server

On the server, just run:

```bat
deploy\update-server.bat
```

- Pulls latest code → `npm install` → `npm run build` → restarts the server.
- **Never touches your local `.env`**, so keys and saved data are safe.
- You normally don't need to touch Caddy again (it keeps running and renews
  the cert automatically).

---

## Stopping / starting manually

```bat
deploy\stop-server.bat    :: stops the app on :5173
deploy\start-server.bat   :: starts the app on :5173
schtasks /End /TN CulinaryQuestCaddy   :: stop Caddy
```

---

## Overview of the pieces

| Piece | Location | Purpose |
|---|---|---|
| Static server | `server.mjs` / `npm start` | Serves `dist/` on :5173 |
| Launchers | `install.bat`, `deploy\*.bat` | One-time setup + daily/server ops |
| Reverse proxy | `deploy\Caddyfile` + `install-caddy*.bat` | HTTPS domain → :5173, auto cert |
| Auto-start | `deploy\install-scheduled-task.bat`, `deploy\install-caddy-auto-start.bat` | Boot-time start |
| Update | `deploy\update-server.bat` | One-step pull/build/restart |
