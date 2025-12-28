import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const OUT_DIR = path.resolve(ROOT, "validation/build");

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1280x800", width: 1280, height: 800 },
  { name: "tablet-834x1112", width: 834, height: 1112 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

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

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  if (process.env.NEXT_CLEAN === "1") {
    await fs.rm(path.resolve(ROOT, ".next"), { recursive: true, force: true }).catch(() => {});
  }

  const port = Number(process.env.PORT || 3000);
  const url = `http://localhost:${port}/`;

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
          path: path.join(OUT_DIR, `${vp.name}.png`),
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
