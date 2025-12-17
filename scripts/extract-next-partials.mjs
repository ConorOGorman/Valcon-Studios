import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INDEX = path.join(ROOT, "index.html");
const OUT_PARTIALS = path.join(ROOT, "src/partials");
const OUT_SECTIONS = path.join(ROOT, "src/sections");

function extractBetween(haystack, startNeedle, endNeedle) {
  const start = haystack.indexOf(startNeedle);
  if (start === -1) throw new Error(`Missing start needle: ${startNeedle}`);
  const end = haystack.indexOf(endNeedle, start + startNeedle.length);
  if (end === -1) throw new Error(`Missing end needle: ${endNeedle}`);
  return haystack.slice(start, end);
}

function extractTag(html, openTagStart, closeTag) {
  const start = html.indexOf(openTagStart);
  if (start === -1) throw new Error(`Missing tag start: ${openTagStart}`);
  const end = html.indexOf(closeTag, start);
  if (end === -1) throw new Error(`Missing close tag: ${closeTag}`);
  return html.slice(start, end + closeTag.length);
}

function extractSection(html, sliceType) {
  const marker = `data-slice-type="${sliceType}"`;
  const idx = html.indexOf(marker);
  if (idx === -1) throw new Error(`Missing slice: ${sliceType}`);
  const start = html.lastIndexOf("<section", idx);

  let pos = start;
  let depth = 0;
  while (pos < html.length) {
    const nextOpen = html.indexOf("<section", pos);
    const nextClose = html.indexOf("</section>", pos);
    if (nextClose === -1) throw new Error(`Unterminated <section> for ${sliceType}`);

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      pos = nextOpen + "<section".length;
      continue;
    }

    depth -= 1;
    pos = nextClose + "</section>".length;
    if (depth === 0) return html.slice(start, pos);
  }

  throw new Error(`Failed to extract slice: ${sliceType}`);
}

async function main() {
  const html = await fs.readFile(INDEX, "utf8");

  await fs.mkdir(OUT_PARTIALS, { recursive: true });
  await fs.mkdir(OUT_SECTIONS, { recursive: true });

  // Preloader: convert to id="preloader" version (matches script.js selectors).
  const preloaderStartMarker = '<div id="preloader" class="fixed top-0 left-0 w-full h-[100dvh]';
  const appShellMarker = '<div id="app-shell" class="opacity-0 blur-xl transition-all duration-500">';
  const preloaderHtml = extractBetween(html, preloaderStartMarker, appShellMarker);

  const appShellStart = html.indexOf(appShellMarker);
  if (appShellStart === -1) throw new Error("Missing app-shell marker");
  const navStart = html.indexOf("<nav", appShellStart);
  if (navStart === -1) throw new Error("Missing <nav> after app shell");
  const appOverlayHtml = html.slice(appShellStart + appShellMarker.length, navStart);

  const navHtml = extractTag(html, '<nav id="site-nav"', "</nav>");
  const footerHtml = extractTag(html, "<footer", "</footer>");

  await fs.writeFile(path.join(OUT_PARTIALS, "preloader.html"), preloaderHtml, "utf8");
  await fs.writeFile(path.join(OUT_PARTIALS, "app-overlay.html"), appOverlayHtml, "utf8");
  await fs.writeFile(path.join(OUT_PARTIALS, "nav.html"), navHtml, "utf8");
  await fs.writeFile(path.join(OUT_PARTIALS, "footer.html"), footerHtml, "utf8");

  const slices = [
    "hero",
    "brands_marquee",
    "video_hero",
    "achievements",
    "services_overview",
    "services_accordion",
    "case_studies_showcase",
    "why_us",
    "process_steps",
    "contact_scheduler",
  ];

  for (const slice of slices) {
    const section = extractSection(html, slice);
    await fs.writeFile(path.join(OUT_SECTIONS, `${slice}.html`), section, "utf8");
  }

  console.log("Extracted partials -> src/partials and sections -> src/sections");
}

await main();

