import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const COOKIE_CONSENT_KEY = "cookie-consent-preferences";

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1280x800", width: 1280, height: 800 },
  { name: "tablet-834x1112", width: 834, height: 1112 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

function parseArgs(argv) {
  const args = { url: null, outDir: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") args.url = argv[++i] ?? args.url;
    if (a === "--outDir") args.outDir = argv[++i] ?? args.outDir;
  }
  if (!args.url) throw new Error("Missing --url");
  return args;
}

function routeSlug(url) {
  const u = new URL(url);
  const slug = u.pathname.replace(/^\//, "").replace(/[^\w/-]+/g, "-").replace(/\//g, "__");
  return slug || "root";
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const { url, outDir } = parseArgs(process.argv);
  const out = outDir ?? path.resolve("validation/routes", routeSlug(url), "source");
  await ensureDir(out);

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const forensics = {
      url,
      capturedAt: new Date().toISOString(),
      viewports: VIEWPORTS,
      cssVars: {},
      outline: {},
    };

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

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
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(out, `${vp.name}.png`),
        fullPage: true,
      });

      if (vp.name === "desktop-1440x900") {
        forensics.cssVars = await page.evaluate(() => {
          const style = getComputedStyle(document.documentElement);
          const vars = {};
          for (let i = 0; i < style.length; i++) {
            const name = style[i];
            if (!name || !name.startsWith("--")) continue;
            const value = style.getPropertyValue(name).trim();
            if (value) vars[name] = value;
          }
          return vars;
        });

        forensics.outline = await page.evaluate(() => {
          const pick = (el) => {
            const box = el.getBoundingClientRect();
            return {
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: typeof el.className === "string" ? el.className : null,
              dataSliceType: el.getAttribute("data-slice-type") || null,
              box: { x: box.x, y: box.y, w: box.width, h: box.height },
            };
          };

          const sections = Array.from(document.querySelectorAll("main section")).map(pick);
          const nav = document.querySelector("nav") ? pick(document.querySelector("nav")) : null;
          const h1 = document.querySelector("main h1") ? pick(document.querySelector("main h1")) : null;
          return { nav, h1, sectionCount: sections.length, sections };
        });
      }

      await context.close();
    }

    await fs.writeFile(path.join(out, "forensics.json"), JSON.stringify(forensics, null, 2) + "\n", "utf8");
  } finally {
    await browser.close();
  }
}

await main();

