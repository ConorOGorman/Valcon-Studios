import fs from "node:fs";
import path from "node:path";
import { replaceBrandInHtml } from "./brand";

function resolveProjectRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "src", "partials"))) return cwd;
  return path.resolve(__dirname, "../../../../");
}

function read(file: string) {
  return replaceBrandInHtml(
    fs.readFileSync(path.join(resolveProjectRoot(), "src", "partials", file), "utf8"),
  );
}

function normalizeMegaMenusHtml(html: string) {
  // The extracted mega-menu markup includes nested <a> tags for the case cards' "SEE WORK" CTA.
  // Nested anchors are invalid in parsed HTML and will be auto-corrected by the browser, breaking layout.
  // Convert the inner CTA links into <div> elements so the parent case-study link remains intact.
  return html.replace(
    /<a class="([^"]*bg-\[#1718fe\][^"]*)" href="(\/en\/case-studies\/[^"]+)">([\s\S]*?)<\/a>/g,
    (_m, className, href, inner) => `<div class="nav-mega-case-cta ${className}" data-href="${href}">${inner}</div>`,
  );
}

export const preloaderHtml = read("preloader.html");
export const appOverlayHtml = read("app-overlay.html");
export const navHtml = read("nav.html");
export const megaMenusHtml = normalizeMegaMenusHtml(read("mega-menus.html"));
export const footerHtml = read("footer.html");
