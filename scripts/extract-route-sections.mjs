import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const COOKIE_CONSENT_KEY = "cookie-consent-preferences";

function parseArgs(argv) {
  const args = { url: null, outDir: path.resolve("src/sections"), slices: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--url") args.url = argv[++i] ?? args.url;
    if (a === "--outDir") args.outDir = argv[++i] ?? args.outDir;
    if (a === "--slice") args.slices.push(argv[++i]);
  }
  if (!args.url) throw new Error("Missing --url");
  if (args.slices.length === 0) throw new Error("Missing --slice (repeatable)");
  return args;
}

function placeholderDataUri(label = "Placeholder") {
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

  html = html.replace(/<video\b[^>]*>/gi, (tag) => {
    const posterMatch = tag.match(/\bposter=(["'])(.*?)\1/i);
    if (!posterMatch) return tag;
    return tag.replace(posterMatch[0], `poster="${placeholder}" data-remote-poster="${posterMatch[2]}"`);
  });

  html = html.replace(/<source\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
    if (!srcMatch) return tag;
    return tag.replace(srcMatch[0], `src="" data-remote-src="${srcMatch[2]}"`);
  });

  html = html.replace(/<iframe\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
    if (!srcMatch) return tag;
    return tag.replace(srcMatch[0], `src="about:blank" data-remote-src="${srcMatch[2]}"`);
  });

  return html;
}

function renameBrand(html) {
  return html.replaceAll("Hatamex", "Valcon").replaceAll("HATAMEX", "VALCON");
}

function normalizeLineMasks(html) {
  // The live site wraps text in `.line-mask > .line` divs for JS-driven reveals.
  // `div` inside `p/h*` is invalid HTML and some browsers re-flow it oddly; convert to spans.
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

function parseSliceSpec(spec) {
  const [sliceType, outName] = spec.split("=").map((s) => s.trim());
  if (!sliceType) throw new Error(`Invalid --slice value: ${spec}`);
  return { sliceType, outName: outName || sliceType };
}

async function main() {
  const { url, outDir, slices } = parseArgs(process.argv);
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
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
    await page
      .waitForFunction(() => {
        const overlay = document.querySelector(
          'div[class*="h-[100dvh]"][class*="bg-black"][class*="transition-opacity"]',
        );
        if (!overlay) return true;
        return getComputedStyle(overlay).opacity === "0";
      }, { timeout: 10_000 })
      .catch(() => {});
    await page.waitForSelector("main", { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(1000);

    for (const spec of slices) {
      const { sliceType, outName } = parseSliceSpec(spec);
      const selector = `section[data-slice-type="${sliceType}"]`;
      let html = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.outerHTML : null;
      }, selector);

      if (!html) {
        await page.waitForSelector(selector, { timeout: 20_000 }).catch(() => {});
        html = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          return el ? el.outerHTML : null;
        }, selector);
      }

      if (!html) throw new Error(`Missing slice on page: ${sliceType}`);

      const output = normalizeLineMasks(renameBrand(rewriteAssetTags(html)));
      const outPath = path.join(outDir, `${outName}.html`);
      await fs.writeFile(outPath, output + "\n", "utf8");
      console.log(`Wrote ${outPath}`);
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

await main();
