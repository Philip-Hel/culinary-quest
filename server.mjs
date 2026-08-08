// Minimal static server for the built Culinary Quest SPA.
//
// Culinary Quest is a pure client-side Vite app — there is no runtime backend.
// `npm run build` produces a self-contained `dist/` folder; this server just
// serves it over HTTP so the app can be reached at http://<host>:5173 from
// the server itself or other devices on the LAN. A reverse proxy (see
// deploy/Caddyfile) can sit in front of it for HTTPS + a domain.
//
// Usage: npm start   (serves dist/ on PORT or 5173)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || "0.0.0.0";
const DIST = fileURLToPath(new URL("./dist", import.meta.url));

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

// Guard: keep requests inside dist/.
function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const file = join(DIST, normalize(decoded).replace(/^(\.\.[/\\])+/, ""));
  return file.startsWith(DIST) ? file : null;
}

createServer(async (req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  let file = safeJoin(urlPath);
  if (!file) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    let data = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    // SPA fallback: serve index.html for unknown client routes.
    if (urlPath.startsWith("/api") || urlPath.includes(".")) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    try {
      const index = await readFile(join(DIST, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(index);
    } catch {
      res.writeHead(503);
      res.end("Build not found: run `npm run build` first.");
    }
  }
}).listen(PORT, HOST, () => {
  console.log(`Culinary Quest serving ${DIST}`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://<this-server-ip>:${PORT}`);
});
