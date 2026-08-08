// Culinary Quest server.
//
// Serves the built SPA (dist/) AND provides a tiny local JSON API so saved
// recipes ("Recipe Book") can be stored on the server instead of only in each
// browser's localStorage. This makes favourites durable across devices and
// browser wipes, and they live in a folder you can back up.
//
// Config (optional, from the .env on the server — NOT committed):
//   CQ_DATA_DIR          folder for the live favorites.json       (default "data")
//   CQ_BACKUP_DIR        folder for timestamped backups            (default "backup")
//   CQ_BACKUP_INTERVAL_MS how often to auto-backup                 (default 6h)
//   PORT / HOST          override the listen port/host             (default 5173 / 0.0.0.0)
//
// To keep this dumpable but self-contained we parse a minimal ".env" (no
// dependency). Key names starting with CQ_ are read here; VITE_* are for the
// browser bundle and ignored by the server.

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, extname, normalize, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

// ---- minimal .env loader (server-side; Vite only loads .env for the client) ----
function loadEnv() {
  const out = { ...process.env };
  const envPath = fileURLToPath(new URL("./.env", import.meta.url));
  try {
    if (!existsSync(envPath)) return out;
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in out)) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* ignore */
  }
  return out;
}

const ENV = loadEnv();

const PORT = Number(ENV.PORT) || 5173;
const HOST = ENV.HOST || "0.0.0.0";
const DIST = fileURLToPath(new URL("./dist", import.meta.url));
const ROOT = fileURLToPath(new URL("./", import.meta.url));

const DATA_DIR = encodePath(ENV.CQ_DATA_DIR || "data");
const BACKUP_DIR = encodePath(ENV.CQ_BACKUP_DIR || "backup");
const BACKUP_INTERVAL_MS = Number(ENV.CQ_BACKUP_INTERVAL_MS) || 6 * 60 * 60 * 1000;
const FAVORITES_FILE = join(DATA_DIR, "favorites.json");

// Resolve a folder: use it as-is if absolute, else relative to the repo root.
function encodePath(p) {
  if (typeof p !== "string") p = String(p);
  const trimmed = p.trim();
  return isAbsolute(trimmed) ? trimmed : join(ROOT, trimmed);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const file = join(DIST, normalize(decoded).replace(/^(\.\.[/\\])+/, ""));
  return file.startsWith(DIST) ? file : null;
}

function send(res, code, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": contentType });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

// ---- favorites store ----
async function readFavorites() {
  try {
    const raw = await readFile(FAVORITES_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return []; // no file yet / unparseable -> start empty
  }
}

async function writeFavorites(list) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(FAVORITES_FILE, JSON.stringify(list, null, 2), "utf8");
  await backupFavorites(); // every save also triggers a backup
}

// Timestamped backup of the live favorites file into the backup folder.
async function backupFavorites() {
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const target = join(BACKUP_DIR, `favorites-${stamp}.json`);
    await copyFile(FAVORITES_FILE, target);
  } catch (err) {
    console.error("[backup] failed:", err);
  }
}

// Periodic auto-backup so early deletions/power loss don't lose history.
setInterval(() => {
  if (existsSync(FAVORITES_FILE)) backupFavorites();
}, BACKUP_INTERVAL_MS);

// ---- http server ----
createServer(async (req, res) => {
  const method = req.method;
  const urlPath = (req.url || "/").split("?")[0];

  // ---- /api/favorites ----
  if (urlPath === "/api/favorites") {
    if (method === "GET") {
      const list = await readFavorites();
      return send(res, 200, list, "application/json; charset=utf-8");
    }
    if (method === "PUT" || method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      let list = [];
      try {
        list = JSON.parse(body || "[]");
        if (!Array.isArray(list)) throw new Error("not array");
      } catch {
        return send(res, 400, { error: "Body must be a JSON array of favorites." });
      }
      await writeFavorites(list);
      return send(res, 200, { ok: true, count: list.length }, "application/json; charset=utf-8");
    }
    return send(res, 405, { error: "Method not allowed" });
  }

  // ---- static files (dist/) ----
  const file = safeJoin(urlPath);
  if (!file) return send(res, 403, "Forbidden");

  try {
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    if (urlPath.startsWith("/api") || urlPath.includes(".")) {
      return send(res, 404, "Not Found");
    }
    try {
      const index = await readFile(join(DIST, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(index);
    } catch {
      send(res, 503, "Build not found: run `npm run build` first.");
    }
  }
}).listen(PORT, HOST, () => {
  console.log(`Culinary Quest serving ${DIST}`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://<this-server-ip>:${PORT}`);
  console.log(`  Data:    ${FAVORITES_FILE}`);
  console.log(`  Backups: ${BACKUP_DIR}`);
});
