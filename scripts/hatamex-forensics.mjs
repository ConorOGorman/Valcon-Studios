import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const SOURCE_URL = "https://www.hatamex.agency/en";
const COOKIE_CONSENT_KEY = "cookie-consent-preferences";

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1280x800", width: 1280, height: 800 },
  { name: "tablet-834x1112", width: 834, height: 1112 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const outDir = path.resolve("validation/source");
  await ensureDir(outDir);

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const forensics = {
      sourceUrl: SOURCE_URL,
      capturedAt: new Date().toISOString(),
      viewports: VIEWPORTS,
      cssVars: {},
      computed: {},
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
      await page.goto(SOURCE_URL, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
      // Wait for preloader to fade (best-effort; keep timeout short to avoid hanging).
      await page
        .waitForFunction(() => {
          const overlay = document.querySelector(
            'div[class*="h-[100dvh]"][class*="bg-black"][class*="transition-opacity"]',
          );
          if (!overlay) return true;
          return getComputedStyle(overlay).opacity === "0";
        }, { timeout: 10_000 })
        .catch(() => {});

      // Allow intro animations to settle for stable screenshots.
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: path.join(outDir, `${vp.name}.png`),
        fullPage: true,
      });

      if (vp.name === "desktop-1440x900") {
        forensics.cssVars = await page.evaluate(() => {
          const rootStyle = getComputedStyle(document.documentElement);
          const pick = (name) => rootStyle.getPropertyValue(name).trim();

          const names = [
            "--spacing",
            "--container-xl",
            "--radius-sm",
            "--radius-lg",
            "--blur-sm",
            "--blur-lg",
            "--blur-xl",
            "--ease-out",
            "--ease-in-out",
            "--default-transition-duration",
            "--default-transition-timing-function",
            "--transition-fast",
            "--transition-ease",
            "--color-background",
            "--color-accent",
            "--color-container",
            "--color-nav-darker-container",
            "--color-gray-text",
            "--color-gray-text-2",
            "--color-nav-text",
            "--color-gray-border",
            "--font-body",
            "--font-title",
            "--font-rinter",
            "--font-source-code-pro",
            "--line-height-body",
          ];

          const out = {};
          for (const name of names) out[name] = pick(name);
          return out;
        });

        forensics.computed = await page.evaluate(() => {
          const bySelector = (selector, properties) => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const style = getComputedStyle(el);
            const box = el.getBoundingClientRect();
            const out = { selector, box: { x: box.x, y: box.y, w: box.width, h: box.height } };
            for (const prop of properties) out[prop] = style.getPropertyValue(prop).trim();
            return out;
          };

          return {
            body: bySelector("body", [
              "background-color",
              "color",
              "font-family",
              "font-size",
              "line-height",
            ]),
            navShell: bySelector("nav > div", [
              "background-color",
              "border-bottom-color",
              "backdrop-filter",
              "height",
            ]),
            hero: {
              section: bySelector('section[data-slice-type="hero"]', [
                "background-color",
                "padding-top",
                "padding-bottom",
              ]),
              eyebrow: bySelector('section[data-slice-type="hero"] p[class*="font-source-code-pro"]', [
                "color",
                "font-family",
                "font-size",
                "font-weight",
                "letter-spacing",
                "text-transform",
                "line-height",
              ]),
              h1: bySelector('section[data-slice-type="hero"] h1', [
                "color",
                "font-family",
                "font-size",
                "font-weight",
                "letter-spacing",
                "line-height",
              ]),
              body: bySelector('section[data-slice-type="hero"] p[class*="font-body"]', [
                "color",
                "font-family",
                "font-size",
                "font-weight",
                "letter-spacing",
                "line-height",
                "max-width",
              ]),
            },
            primaryButton: (() => {
              const el = Array.from(document.querySelectorAll("a,button")).find((n) => {
                const text = n.textContent?.trim() ?? "";
                return text === "BOOK A CALL" && n.getAttribute("href")?.includes("/en/contact");
              });
              if (!el) return null;
              const style = getComputedStyle(el);
              const box = el.getBoundingClientRect();
              return {
                selector: "a[href*=\"/en/contact\"] (first BOOK A CALL)",
                box: { x: box.x, y: box.y, w: box.width, h: box.height },
                "background-color": style.getPropertyValue("background-color").trim(),
                color: style.getPropertyValue("color").trim(),
                "border-radius": style.getPropertyValue("border-radius").trim(),
                "padding-inline": style.getPropertyValue("padding-inline").trim(),
                "padding-block": style.getPropertyValue("padding-block").trim(),
                "font-family": style.getPropertyValue("font-family").trim(),
                "font-size": style.getPropertyValue("font-size").trim(),
                "font-weight": style.getPropertyValue("font-weight").trim(),
                "letter-spacing": style.getPropertyValue("letter-spacing").trim(),
                "text-transform": style.getPropertyValue("text-transform").trim(),
              };
            })(),
          };
        });
      }

      await context.close();
    }

    await fs.writeFile(
      path.resolve("validation/source/forensics.json"),
      JSON.stringify(forensics, null, 2) + "\n",
      "utf-8",
    );
  } finally {
    await browser.close();
  }
}

await main();
