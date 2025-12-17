import fs from "node:fs";
import path from "node:path";

function read(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "src", "partials", file), "utf8");
}

export const preloaderHtml = read("preloader.html");
export const appOverlayHtml = read("app-overlay.html");
export const navHtml = read("nav.html");
export const footerHtml = read("footer.html");

