import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const COOKIE_CONSENT_KEY = "cookie-consent-preferences";

function parseArgs(argv) {
  const args = {
    url: "https://www.hatamex.agency/en",
    outFile: path.resolve("src/partials/mega-menus.html"),
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") args.url = argv[++i] ?? args.url;
    if (a === "--outFile") args.outFile = argv[++i] ?? args.outFile;
  }
  return args;
}

function placeholderDataUri(label = "VALCON") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0b0b0b"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><rect x="80" y="80" width="1040" height="640" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/><text x="600" y="420" fill="rgba(255,255,255,0.45)" font-family="ui-sans-serif, system-ui" font-size="28" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function rewriteAssetTags(html) {
  const placeholder = placeholderDataUri("VALCON");

  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
    const srcSetMatch = tag.match(/\bsrcset=(["'])(.*?)\1/i) || tag.match(/\bsrcSet=(["'])(.*?)\1/i);

    let out = tag;
    if (srcSetMatch) {
      out = out.replace(srcSetMatch[0], `data-remote-srcset=${srcSetMatch[1]}${srcSetMatch[2]}${srcSetMatch[1]}`);
    }
    if (srcMatch) {
      out = out.replace(srcMatch[0], `src="${placeholder}" data-remote-src="${srcMatch[2]}"`);
    }
    return out;
  });

  return html;
}

function renameBrand(html) {
  return html.replaceAll("Hatamex", "Valcon").replaceAll("HATAMEX", "VALCON");
}

function normalizeLineMasks(html) {
  let next = html;
  for (let i = 0; i < 50; i++) {
    const prev = next;
    next = next.replace(
      /<div class="(line-mask[^"]*)"([^>]*)><div class="(line[^"]*)"([^>]*)>([\s\S]*?)<\/div><\/div>/g,
      '<span class="$1"$2><span class="$3"$4>$5</span></span>',
    );
    if (next === prev) break;
  }
  return next;
}

function fixNestedCaseCtas(html) {
  // The source menu uses nested <a> tags for the "SEE WORK" button inside a larger <a> card.
  // When we later inject this markup as HTML, browsers will auto-correct nested anchors and break layout.
  // Convert the inner CTA link to a <div> so the outer card link remains intact.
  return html.replace(
    /<a class="([^"]*bg-\[#1718fe\][^"]*)" href="(\/en\/case-studies\/[^"]+)">([\s\S]*?)<\/a>/g,
    (_m, className, href, inner) =>
      `<div class="nav-mega-case-cta ${className}" data-href="${href}">${inner}</div>`,
  );
}

function decorateMenu(html, key) {
  let out = html;

  // Outer wrapper: remove inline styles and add our state attributes.
  out = out.replace(
    /<div class="fixed left-0 right-0 z-40"[^>]*?>/i,
    `<div class="nav-mega fixed left-0 right-0 z-40" data-mega-menu="${key}" data-open="false" aria-hidden="true">`,
  );

  // Inner surface: remove inline clip-path style and add hook class.
  out = out.replace(
    /<div class="(w-full bg-white[^"]*?)" style="clip-path:[^"]*?">/i,
    (_m, cls) => `<div class="${cls} nav-mega-surface">`,
  );

  // Remove inline animation styles captured mid-transition so our runtime can drive visibility.
  // Keep layout-related inline styles (e.g. explicit widths and absolutely positioned images).
  out = out.replace(/\sstyle="[^"]*opacity:\s*0[^"]*"/gi, "");
  out = out.replace(/\sstyle="opacity:\s*1;\s*transform:\s*none;"/gi, "");
  out = out.replace(/\sstyle="opacity:\s*1;\s*transform:\s*translate[XY]\([^"]*\);"/gi, "");
  out = out.replace(/\sstyle="opacity:\s*1;\s*transform:\s*translate[XY]\([^"]*\)\s*scale\([^"]*\);"/gi, "");
  return out;
}

async function main() {
  const { url, outFile } = parseArgs(process.argv);
  await fs.mkdir(path.dirname(outFile), { recursive: true });

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
    await page.waitForSelector("nav", { timeout: 30_000 });
    await page.waitForTimeout(1400);

    const capture = async (key, triggerHref) => {
      await page.locator(`nav a[href="${triggerHref}"] svg`).first().hover({ timeout: 10_000 });
      await page.waitForTimeout(250);
      await page.locator("div.fixed.left-0.right-0.z-40").first().waitFor({ state: "visible", timeout: 10_000 });
      if (key === "services") {
        await page
          .waitForFunction(() => document.body.innerText.includes("EXPLORE ALL SERVICES"), { timeout: 10_000 })
          .catch(() => {});
      } else {
        await page
          .waitForFunction(() => document.body.innerText.includes("Our latest case studies"), { timeout: 10_000 })
          .catch(() => {});
      }
      const html = await page.evaluate(() => document.querySelector("div.fixed.left-0.right-0.z-40")?.outerHTML ?? "");
      if (!html) throw new Error(`Failed to capture mega menu: ${key}`);
      let out = decorateMenu(normalizeLineMasks(renameBrand(rewriteAssetTags(html))), key);
      if (key === "cases") out = fixNestedCaseCtas(out);
      return out;
    };

    const services = await capture("services", "/en/services");
    // Move mouse so we can reliably open the next menu.
    await page.mouse.move(10, 10);
    await page.waitForTimeout(200);
    const cases = await capture("cases", "/en/cases");

    const output = `<!-- Generated via scripts/extract-nav-mega-menus.mjs -->\n${services}\n${cases}\n`;
    await fs.writeFile(outFile, output, "utf8");
    console.log(`Wrote ${outFile}`);

    await context.close();
  } finally {
    await browser.close();
  }
}

await main();
