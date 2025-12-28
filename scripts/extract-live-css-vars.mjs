import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const DEFAULT_URL = "https://www.hatamex.agency/en/services";
const COOKIE_CONSENT_KEY = "cookie-consent-preferences";

function parseArgs(argv) {
  const args = { url: DEFAULT_URL, out: "validation/live-css-vars.json" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") args.url = argv[++i] ?? args.url;
    if (a === "--out") args.out = argv[++i] ?? args.out;
  }
  return args;
}

async function main() {
  const { url, out } = parseArgs(process.argv);
  await fs.mkdir(path.dirname(out), { recursive: true });

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await context.addInitScript(({ key }) => {
      try {
        const value = JSON.stringify({
          necessary: true,
          analytics: true,
          marketing: true,
          timestamp: Date.now(),
        });
        localStorage.setItem(key, value);
      } catch {}
    }, { key: COOKIE_CONSENT_KEY });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    // Best-effort: wait for the overlay preloader to fade.
    await page
      .waitForFunction(() => {
        const overlay = document.querySelector('div[class*="h-[100dvh]"][class*="bg-black"][class*="transition-opacity"]');
        if (!overlay) return true;
        return getComputedStyle(overlay).opacity === "0";
      }, { timeout: 10_000 })
      .catch(() => {});

    const payload = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const vars = {};

      for (let i = 0; i < rootStyle.length; i++) {
        const name = rootStyle[i];
        if (!name || !name.startsWith("--")) continue;
        const value = rootStyle.getPropertyValue(name).trim();
        if (value) vars[name] = value;
      }

      return {
        url: window.location.href,
        capturedAt: new Date().toISOString(),
        cssVarCount: Object.keys(vars).length,
        cssVars: vars,
      };
    });

    await fs.writeFile(out, JSON.stringify(payload, null, 2) + "\n", "utf8");
    await context.close();
    console.log(`Wrote ${payload.cssVarCount} vars to ${out}`);
  } finally {
    await browser.close();
  }
}

await main();

