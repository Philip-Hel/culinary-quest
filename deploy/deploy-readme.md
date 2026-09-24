# Deploying Culinary Quest to your Windows Home Server (HTTPS via Caddy)

This turns Culinary Quest into a server that runs on a **Windows home server**
and is reachable over **HTTPS at your own domain**, backed by the same approach
as the Trading Assistant project: a Node server on a LAN port, fronted by a
Caddy reverse proxy that provides a publicly-trusted Let's Encrypt certificate.

Culinary Quest is a **pure client-side app** — there is no backend database, so
this deploy is simpler than Trading Assistant. The "server" serves the built
`dist/` folder (`npm start` → `server.mjs` on port **5173**) AND provides a tiny
JSON API (`GET/PUT /api/favorites`) so your **Saved Recipes (Recipe Book)** are
stored **on the server** (`data/favorites.json`) instead of only in each browser.
Every save is auto-backed up to `backup/` (a timestamped copy) plus periodically.
Both folders are gitignored — your data never gets committed. You can point them
anywhere via `CQ_DATA_DIR` / `CQ_BACKUP_DIR` (e.g. a OneDrive-synced or
drive-backed folder) in `.env`.

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
deploy\install-scheduled-task.bat     :: starts the app (node server.mjs) at boot
deploy\install-caddy-auto-start.bat   :: starts Caddy (the proxy) at boot
```

### Why these run as SYSTEM (important)

Both installers create the task with **`/RU "SYSTEM"`**:

```bat
schtasks /Create /TN "CulinaryQuest" ... /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F
```

That parameter is what makes the task start **at boot with no user logged in**.
If you create a task *without* an explicit `/RU`, Windows defaults to
**"run only when the user is logged on"** — so after a reboot nothing starts
until someone signs in (which looks like "the app didn't come back after a
restart"). `SYSTEM` needs no password and avoids that trap.

> **Upgrading an existing (broken) install:** if you registered the tasks before
> this fix, delete and re-create them (admin):
>
> ```bat
> schtasks /Delete /TN "CulinaryQuest" /F
> schtasks /Delete /TN "CulinaryQuestCaddy" /F
> deploy\install-scheduled-task.bat
> deploy\install-caddy-auto-start.bat
> ```

### Verify / troubleshoot

```bat
:: See the task, its account, and last result
schtasks /Query /TN "CulinaryQuest" /V /FO LIST
schtasks /Query /TN "CulinaryQuestCaddy" /V /FO LIST
```

- **"Run As User: SYSTEM"** and **"Logon Mode: Interactive/Background"** confirm
  it will run without a sign-in.

> **Backups under SYSTEM (`CQ_BACKUP_DIR`):** the server now runs as SYSTEM, so
> the backup folder in `.env` must be a **plain absolute path** —
> e.g. `CQ_BACKUP_DIR=C:\Users\<you>\OneDrive\CulinaryQuestBackups`.
> Do **not** use `%OneDrive%` / `%USERPROFILE%` in the path: those expand to
> *SYSTEM's* profile, not yours, so backups would go to the wrong place or fail.
> Note also that OneDrive's sync client runs in your user session — SYSTEM writes
> the file locally, and it uploads to the cloud once your session syncs it.
> A **user-mapped network drive** (`Z:\`) won't be visible to SYSTEM either; use
> a UNC path (`\\server\share\...`) instead.

- The app task logs to **`deploy\server.log`** (node stdout/stderr + a startup
  line). If the app doesn't come up after a reboot, read that log first.
- `start-server.bat` resolves `node.exe` explicitly (PATH, then
  `C:\Program Files\nodejs`) and runs `node server.mjs` directly — it does not
  rely on `npm`/the user PATH, which SYSTEM does not have.
- Force a run right now to test without rebooting:

  ```bat
  schtasks /Run /TN "CulinaryQuest"
  schtasks /Run /TN "CulinaryQuestCaddy"
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
