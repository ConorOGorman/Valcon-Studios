import fs from "node:fs/promises";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = { outDir: path.resolve(ROOT, "validation", "tmp-nav-hover"), port: 3000 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--outDir") args.outDir = path.resolve(argv[++i] ?? args.outDir);
    if (a === "--port") args.port = Number(argv[++i] ?? args.port);
  }
  return args;
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
  const { outDir, port } = parseArgs(process.argv);
  await fs.mkdir(outDir, { recursive: true });

  const baseUrl = `http://localhost:${port}`;
  const url = `${baseUrl}/en?assets=remote`;

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
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => !document.getElementById("preloader"), { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(900);

      const shot = async (name) => {
        await page.screenshot({ path: path.join(outDir, name), fullPage: false });
      };

      await page.hover('#site-nav a[href="/en/cases"]');
      await page.waitForTimeout(350);
      await shot("cases-open.png");

      await page.locator('.nav-mega[data-mega-menu="cases"] .nav-mega-case-cta').first().hover();
      await page.waitForTimeout(250);
      await shot("cases-cta-hover.png");

      await page.hover('#site-nav a[href="/en/services"]');
      await page.waitForTimeout(350);
      await shot("services-open.png");

      await page.hover('.nav-mega[data-mega-menu="services"] a[href="/en/service/digital-marketing"]');
      await page.waitForTimeout(250);
      await shot("services-item-hover.png");

      await context.close();
    } finally {
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }
}

await main();

