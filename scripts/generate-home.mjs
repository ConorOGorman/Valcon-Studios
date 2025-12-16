import fs from "node:fs/promises";

const SOURCE_HTML_PATH = new URL("../source/hatamex-en.html", import.meta.url);
const HERO_LIVE_PATH = new URL("../source/hero-live.html", import.meta.url);
const OUT_PATH = new URL("../index.html", import.meta.url);

function extractBetween(haystack, startNeedle, endNeedle) {
  const start = haystack.indexOf(startNeedle);
  if (start === -1) throw new Error(`Missing start needle: ${startNeedle}`);
  const end = haystack.indexOf(endNeedle, start + startNeedle.length);
  if (end === -1) throw new Error(`Missing end needle: ${endNeedle}`);
  return haystack.slice(start, end);
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

function extractTag(html, openTagStart) {
  const start = html.indexOf(openTagStart);
  if (start === -1) throw new Error(`Missing tag start: ${openTagStart}`);
  const closeTag = openTagStart.startsWith("<nav") ? "</nav>" : "</footer>";
  const end = html.indexOf(closeTag, start);
  if (end === -1) throw new Error(`Missing close tag: ${closeTag}`);
  return html.slice(start, end + closeTag.length);
}

function extractDivBlock(html, marker) {
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`Missing div marker: ${marker}`);

  let pos = start;
  let depth = 0;
  while (pos < html.length) {
    const nextOpen = html.indexOf("<div", pos);
    const nextClose = html.indexOf("</div>", pos);
    if (nextClose === -1) throw new Error("Unterminated <div> block");

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      pos = nextOpen + "<div".length;
      continue;
    }

    depth -= 1;
    pos = nextClose + "</div>".length;
    if (depth === 0) return html.slice(start, pos);
  }

  throw new Error("Failed to extract <div> block");
}

function placeholderDataUri(label = "Placeholder") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0b0b0b"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><rect x="80" y="80" width="1040" height="640" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/><text x="600" y="420" fill="rgba(255,255,255,0.45)" font-family="ui-sans-serif, system-ui" font-size="28" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function swapNavWordmark(navHtml) {
  const marker = 'h-[21.299px] lg:h-[25px] overflow-hidden';
  const startIdx = navHtml.indexOf(marker);
  if (startIdx === -1) return navHtml;

  const divStart = navHtml.lastIndexOf("<div", startIdx);
  if (divStart === -1) return navHtml;

  const endNeedle = "</svg></div></div>";
  const endIdx = navHtml.indexOf(endNeedle, startIdx);
  if (endIdx === -1) return navHtml;

  const before = navHtml.slice(0, divStart);
  const after = navHtml.slice(endIdx + endNeedle.length);

  const replacement = `<div class="flex items-center h-[21.299px] lg:h-[25px] overflow-hidden" style="clip-path:inset(0 0% 0 0);width:127.395px"><span class="font-rinter text-white text-[20px] lg:text-[22px] leading-none tracking-[-0.8px]">Valcon</span></div>`;
  return `${before}${replacement}${after}`;
}

function rewriteAssetTags(html) {
  const placeholder = placeholderDataUri("VALCON");

  // <img ... src=... srcSet=...>
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
    const srcSetMatch = tag.match(/\bsrcset=(["'])(.*?)\1/i) || tag.match(/\bsrcSet=(["'])(.*?)\1/i);

    let out = tag;
    if (srcSetMatch) {
      out = out.replace(srcSetMatch[0], `data-remote-srcset=${srcSetMatch[1]}${srcSetMatch[2]}${srcSetMatch[1]}`);
    }
    if (srcMatch) {
      out = out.replace(srcMatch[0], `src=\"${placeholder}\" data-remote-src=\"${srcMatch[2]}\"`);
    }
    return out;
  });

  // <video poster=...><source src=...></video>
  html = html.replace(/<video\b[^>]*>/gi, (tag) => {
    const posterMatch = tag.match(/\bposter=(["'])(.*?)\1/i);
    if (!posterMatch) return tag;
    return tag.replace(
      posterMatch[0],
      `poster=\"${placeholder}\" data-remote-poster=\"${posterMatch[2]}\"`,
    );
  });

  html = html.replace(/<source\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
    if (!srcMatch) return tag;
    return tag.replace(srcMatch[0], `src=\"\" data-remote-src=\"${srcMatch[2]}\"`);
  });

  // cal.com iframe (default to placeholder/offline)
  html = html.replace(/<iframe\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=(["'])(.*?)\1/i);
    if (!srcMatch) return tag;
    return tag.replace(srcMatch[0], `src=\"about:blank\" data-remote-src=\"${srcMatch[2]}\"`);
  });

  return html;
}

function buildHead() {
  return `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Valcon Digital Agency – Clone</title>
    <link rel="preload" href="assets/media/PlusJakartaSans_Variable-s.p.f95c7fb9.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="assets/media/Rinter-s.p.01abee16.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="assets/media/c9e42e3eae6237c2-s.p.24d96596.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="assets/css/hatamex.css" />
    <link rel="stylesheet" href="assets/css/keen.css" />
    <link rel="stylesheet" href="styles/tokens.css" />
    <link rel="stylesheet" href="styles/app.css" />
  </head>`;
}

function renameBrand(html) {
  // Only replace case-sensitive occurrences (avoid breaking lower-case asset URLs like `/hatamex/...`).
  return html.replaceAll("Hatamex", "Valcon").replaceAll("HATAMEX", "VALCON");
}

function buildBody({ preloaderHtml, appOverlayHtml, navHtml, mainHtml, footerHtml }) {
  const bodyClass =
    'source_code_pro_f572e928-module__Jbvasa__variable plusjakartasans_c4d1b992-module__AWQD7G__variable rinter_9b3e34ce-module__OAx_Kq__variable bg-black';
  return `
  <body class="${bodyClass}">
    ${preloaderHtml}
    <div id="app-shell" class="opacity-0 blur-xl transition-all duration-500">
      ${appOverlayHtml}
      ${navHtml}
      ${mainHtml}
      ${footerHtml}
    </div>
    <script src="script.js" defer></script>
  </body>
</html>
`;
}

async function main() {
  const sourceHtml = await fs.readFile(SOURCE_HTML_PATH, "utf8");
  const heroLive = await fs.readFile(HERO_LIVE_PATH, "utf8");

  const preloaderStartMarker = '<div class="fixed top-0 left-0 w-full h-[100dvh]';
  const appWrapperMarker = '<div class="opacity-0 blur-xl transition-all duration-500">';
  const preloaderRaw = extractBetween(sourceHtml, preloaderStartMarker, appWrapperMarker);
  const preloaderHtml = preloaderRaw.replace(preloaderStartMarker, '<div id="preloader" class="fixed top-0 left-0 w-full h-[100dvh]');

  let navHtml = extractTag(sourceHtml, '<nav class="fixed').replace(
    '<nav class="fixed',
    '<nav id="site-nav" class="fixed',
  );
  navHtml = swapNavWordmark(navHtml);

  // Live sets inline width/top via motion; keep the same baseline so `lg:w-auto` doesn't
  // collapse the bar at desktop when the preloader finishes.
  navHtml = navHtml.replace(
    /<nav id="site-nav"([^>]*?)style="([^"]*)"/,
    (_match, before, style) => {
      const parts = style
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);
      const hasWidth = parts.some((part) => part.startsWith("width:"));
      const hasTop = parts.some((part) => part.startsWith("top:"));
      if (!hasWidth) parts.push("width:100%");
      if (!hasTop) parts.push("top:0px");
      return `<nav id="site-nav"${before}style="${parts.join(";")}"`;
    },
  );

  const appWrapperStart = sourceHtml.indexOf(appWrapperMarker);
  if (appWrapperStart === -1) throw new Error("Missing app wrapper marker");
  const navStart = sourceHtml.indexOf("<nav", appWrapperStart);
  if (navStart === -1) throw new Error("Missing <nav> after wrapper");
  const appOverlayHtml = sourceHtml.slice(appWrapperStart + appWrapperMarker.length, navStart);

  const heroCollage = extractDivBlock(
    heroLive,
    '<div class="hidden lg:flex relative right-0 bottom-0 h-screen w-full">',
  );

  let hero = extractSection(sourceHtml, "hero");
  const insertAt = hero.lastIndexOf("</div></section>");
  if (insertAt === -1) throw new Error("Unexpected hero HTML shape");
  hero = hero.slice(0, insertAt) + heroCollage + hero.slice(insertAt);

  const slices = [
    hero,
    extractSection(sourceHtml, "brands_marquee"),
    extractSection(sourceHtml, "video_hero"),
    extractSection(sourceHtml, "achievements"),
    extractSection(sourceHtml, "services_overview"),
    extractSection(sourceHtml, "services_accordion"),
    extractSection(sourceHtml, "case_studies_showcase"),
    extractSection(sourceHtml, "why_us"),
    extractSection(sourceHtml, "process_steps"),
    extractSection(sourceHtml, "contact_scheduler"),
  ];

  const mainHtml = `<main class="bg-background">${slices.join("")}</main>`;

  const footerHtml = extractTag(sourceHtml, "<footer");

  const output = renameBrand(
    `${buildHead()}${buildBody({
      preloaderHtml: rewriteAssetTags(preloaderHtml),
      appOverlayHtml,
      navHtml,
      mainHtml: rewriteAssetTags(mainHtml),
      footerHtml: rewriteAssetTags(footerHtml),
    })}`,
  );

  await fs.writeFile(OUT_PATH, output, "utf8");
}

await main();
