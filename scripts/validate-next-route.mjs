import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1280x800", width: 1280, height: 800 },
  { name: "tablet-834x1112", width: 834, height: 1112 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

function parseArgs(argv) {
  const args = { route: "/en/services", outDir: null, port: 3000 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--route") args.route = argv[++i] ?? args.route;
    if (a === "--outDir") args.outDir = argv[++i] ?? args.outDir;
    if (a === "--port") args.port = Number(argv[++i] ?? args.port);
  }
  return args;
}

function routeSlug(route) {
  return route.replace(/^\//, "").replace(/[^\w/-]+/g, "-").replace(/\//g, "__") || "root";
}

function waitForServer(url, { timeoutMs = 20_000 } = {}) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url, { redirect: "follow" });
        if (res.ok) return resolve();
      } catch {}

      if (Date.now() - start > timeoutMs) return reject(new Error("Timed out waiting for server"));
      setTimeout(tick, 250);
    };
    void tick();
  });
}

function freePort(port) {
  if (process.platform === "win32") return;
  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
    const pids = out
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
    for (const pid of pids) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }
  } catch {
    // Port is likely free; ignore.
  }
}

async function main() {
  const { route, outDir, port } = parseArgs(process.argv);
  const out = outDir ?? path.resolve(ROOT, "validation/routes", routeSlug(route), "build");
  await fs.mkdir(out, { recursive: true });

  const baseUrl = `http://localhost:${port}`;
  const url = `${baseUrl}${route}`;

  freePort(port);
  const server = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "dev", "-p", String(port)],
    { cwd: ROOT, stdio: "inherit", env: { ...process.env, NODE_ENV: "development" } },
  );

  try {
    await waitForServer(url);

    const browser = await chromium.launch({ headless: true, channel: "chrome" });
    try {
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page
          .waitForFunction(() => !document.getElementById("preloader"), { timeout: 20_000 })
          .catch(() => {});
        await page.waitForTimeout(1500);

        await page.screenshot({
          path: path.join(out, `${vp.name}.png`),
          fullPage: true,
        });

        await context.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }
}

await main();
