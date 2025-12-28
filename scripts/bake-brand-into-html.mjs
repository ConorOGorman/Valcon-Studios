import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const BRAND = "Lucid Studio's";
const BRAND_UPPER = "LUCID STUDIO'S";

function replaceBrandText(input) {
  return input
    .replaceAll("VALCON DIGITAL AGENCY", BRAND_UPPER)
    .replaceAll("Valcon Digital Agency", BRAND)
    .replaceAll("Hatamex", BRAND)
    .replaceAll("Valcon", BRAND);
}

function replaceBrandInHtml(html) {
  const withTextNodes = html.replace(/>([^<]*)</g, (_match, text) => {
    return `>${replaceBrandText(text)}<`;
  });

  return withTextNodes.replace(
    /\b(aria-label|alt|title)="([^"]*)"/g,
    (_match, attr, value) => `${attr}="${replaceBrandText(value)}"`,
  );
}

async function processDir(dir) {
  const abs = path.join(ROOT, dir);
  const entries = await fs.readdir(abs, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((e) => e.isFile() && e.name.endsWith(".html"))
      .map(async (e) => {
        const filePath = path.join(abs, e.name);
        const raw = await fs.readFile(filePath, "utf8");
        const next = replaceBrandInHtml(raw);
        if (next !== raw) await fs.writeFile(filePath, next, "utf8");
      }),
  );
}

await processDir("src/partials");
await processDir("src/sections");

console.log("Baked brand replacements into HTML sources.");

