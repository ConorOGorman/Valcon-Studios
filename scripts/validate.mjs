import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const OUT_DIR = path.resolve(ROOT, "validation/build");
const SOURCE_DIR = path.resolve(ROOT, "validation/source");

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1280x800", width: 1280, height: 800 },
  { name: "tablet-834x1112", width: 834, height: 1112 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

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

async function startServer() {
  const server = http.createServer((req, res) => {
    void serveFile(req, res);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to bind server");
  const url = `http://127.0.0.1:${address.port}/?assets=remote`;
  return { server, url };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: true, channel: "chrome" });

  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: "domcontentloaded" });

      // Wait for our preloader to complete and for initial reveals to settle.
      await page
        .waitForFunction(() => {
          const preloader = document.getElementById("preloader");
          if (!preloader) return true;
          return getComputedStyle(preloader).opacity === "0";
        }, { timeout: 20_000 })
        .catch(() => {});

      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(OUT_DIR, `${vp.name}.png`),
        fullPage: true,
      });

      await context.close();
    }

    const notes = [
      `Captured: ${new Date().toISOString()}`,
      `URL: ${url}`,
      `Build screenshots: ${path.relative(ROOT, OUT_DIR)}`,
      `Source screenshots: ${path.relative(ROOT, SOURCE_DIR)}`,
      "Compare side-by-side in your image viewer.",
    ].join("\n");

    await fs.writeFile(path.join(OUT_DIR, "README.txt"), notes + "\n", "utf8");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

await main();

