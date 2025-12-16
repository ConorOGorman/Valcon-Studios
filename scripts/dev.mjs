import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT || 5173);
const SHOULD_OPEN = process.argv.includes("--open");

const MIME_BY_EXT = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

function safePathFromUrl(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  const clean = decoded.replace(/\\/g, "/");
  const rel = clean === "/" ? "/index.html" : clean;
  const resolved = path.resolve(ROOT, "." + rel);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

async function serveFile(req, res) {
  const filename = safePathFromUrl(req.url || "/");
  if (!filename) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  let fileToServe = filename;
  try {
    const st = await stat(fileToServe);
    if (st.isDirectory()) fileToServe = path.join(fileToServe, "index.html");
  } catch {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(fileToServe);
  const type = MIME_BY_EXT[ext] || "application/octet-stream";
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", "no-store");
  createReadStream(fileToServe).pipe(res);
}

function openBrowser(url) {
  const platform = process.platform;
  const cmd =
    platform === "darwin"
      ? `open \"${url}\"`
      : platform === "win32"
        ? `start \"\" \"${url}\"`
        : `xdg-open \"${url}\"`;
  exec(cmd, () => {});
}

const server = http.createServer((req, res) => {
  void serveFile(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}/?assets=remote`;
  console.log(`Serving ${ROOT}`);
  console.log(`Open: ${url}`);
  if (SHOULD_OPEN) openBrowser(url);
});
