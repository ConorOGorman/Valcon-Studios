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

const BREAKPOINTS = [
  { name: "tablet", minWidth: 834 },
  { name: "desktop", minWidth: 1280 },
];

function clean(value) {
  if (value == null) return "";
  return String(value).trim();
}

function ensure(value, label) {
  const out = clean(value);
  if (!out) throw new Error(`Missing value for ${label}`);
  return out;
}

function formatTokenSection(title, entries) {
  const lines = [`  /* ${title} */`];
  for (const [name, value] of entries) lines.push(`  ${name}: ${value};`);
  return lines.join("\n");
}

function toMdToken(token) {
  return [
    `- \`${token.name}\` = \`${token.value}\``,
    `  - Source element: ${token.sourceElement}`,
    `  - DevTools: ${token.devtools}`,
    `  - Property: \`${token.property}\``,
  ].join("\n");
}

async function waitForPreloader(page) {
  await page
    .waitForFunction(() => {
      const overlay = document.querySelector(
        'div[class*="h-[100dvh]"][class*="bg-black"][class*="transition-opacity"]',
      );
      if (!overlay) return true;
      return getComputedStyle(overlay).opacity === "0";
    }, { timeout: 10_000 })
    .catch(() => {});
}

async function focusVisibleSnapshot(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await page.click("body", { position: { x: 2, y: 2 } }).catch(() => {});

  // Try keyboard navigation first to trigger :focus-visible, fallback to programmatic focus.
  for (let i = 0; i < 40; i++) {
    const isTarget = await locator.evaluate((el) => document.activeElement === el).catch(() => false);
    if (isTarget) break;
    await page.keyboard.press("Tab").catch(() => {});
  }

  const snapshot = await locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      isFocusVisible: el.matches(":focus-visible"),
      outline: style.outline,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
      borderRadius: style.borderRadius,
    };
  });

  if (snapshot.isFocusVisible) return snapshot;

  await locator.focus().catch(() => {});
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      isFocusVisible: el.matches(":focus-visible"),
      outline: style.outline,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
      borderRadius: style.borderRadius,
    };
  });
}

async function computed(locator, properties) {
  return locator.evaluate((el, props) => {
    const style = getComputedStyle(el);
    const out = {};
    for (const prop of props) out[prop] = style.getPropertyValue(prop).trim();
    return out;
  }, properties);
}

async function main() {
  const outCss = path.resolve("public/styles/hatamex.tokens.css");
  const outNotes = path.resolve("docs/hatamex-token-extraction-notes.md");
  await fs.mkdir(path.dirname(outCss), { recursive: true });
  await fs.mkdir(path.dirname(outNotes), { recursive: true });

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const collected = new Map();
    const byViewport = new Map();

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
      await waitForPreloader(page);
      await page.waitForTimeout(1200);
      await page.waitForSelector("nav", { timeout: 15_000, state: "attached" });
      await page.waitForSelector('section[data-slice-type="hero"] h1', { timeout: 15_000, state: "attached" });

      const body = page.locator("body");
      const navShell = page.locator("nav").first();
      const heroH1 = page.locator('section[data-slice-type="hero"] h1').first();
      const heroEyebrow = page.locator('section[data-slice-type="hero"] p[class*="font-source-code-pro"]').first();
      const heroBody = page.locator('section[data-slice-type="hero"] p[class*="font-body"]').first();

      const bookCall = page
        .locator('a[href*="/en/contact"], button')
        .filter({ hasText: /^BOOK A CALL$/ })
        .first();

      const resultsEyebrow = page.locator("p,span").filter({ hasText: /^RESULTS$/ }).first();

      const impactH2 = page
        .locator("h2")
        .filter({ hasText: /^Impact you can feel$/ })
        .first();

      const serviceH3 = page
        .locator("h3")
        .filter({ hasText: /^Brand Strategy & Identity$/ })
        .first();

      const secondaryButton = page
        .locator("a,button")
        .filter({ hasText: /^EXPLORE OUR WORK$/ })
        .first();

      const container = page.locator('[class*="max-w-\\[1500px\\]"]').first();
      const sectionPadding = page.locator("section.section-padding").first();

      const serviceItemIndex = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll(".service-item"));
        for (let i = 0; i < items.length; i++) {
          const style = getComputedStyle(items[i]);
          const top = style.borderTopWidth.trim();
          const bottom = style.borderBottomWidth.trim();
          if (top !== "0px" || bottom !== "0px") return i;
        }
        return 0;
      });
      const serviceItem = page.locator(".service-item").nth(serviceItemIndex);

      const gradientOverlay = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll("section *"));
        for (const el of nodes) {
          const style = getComputedStyle(el);
          const bg = style.getPropertyValue("background-image").trim();
          if (!bg || bg === "none") continue;
          if (!bg.includes("gradient(") && !bg.includes("gradient")) continue;
          const className = (el.className ?? "").toString().trim();
          return {
            backgroundImage: bg,
            descriptor: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${
              className ? `.${className.split(" ").filter(Boolean).slice(0, 3).join(".")}` : ""
            }`,
          };
        }
        return null;
      });

      const bookCallHover = await (async () => {
        try {
          await bookCall.hover({ timeout: 5_000 });
          await page.waitForTimeout(400);
          return await computed(bookCall, ["background-color", "color"]);
        } catch {
          return null;
        }
      })();

      const secondaryButtonHover = await (async () => {
        try {
          await secondaryButton.hover({ timeout: 5_000 });
          await page.waitForTimeout(400);
          return await computed(secondaryButton, ["background-color", "color", "border-color"]);
        } catch {
          return null;
        }
      })();

      const serviceItemHover = await (async () => {
        try {
          await serviceItem.hover({ timeout: 5_000 });
          await page.waitForTimeout(400);
          return await computed(serviceItem, ["background-color", "transform", "box-shadow"]);
        } catch {
          return null;
        }
      })();

      const navProbe = await page.evaluate(() => {
        const norm = (s) => (s ?? "").trim();
        const parseAlpha = (color) => {
          const c = norm(color);
          if (!c) return 0;
          if (c === "transparent") return 0;
          const end = c.lastIndexOf(")");
          const start = c.indexOf("(");
          const inner = start >= 0 && end > start ? c.slice(start + 1, end).trim() : "";

          // Space-separated "rgb(0 0 0 / 0.4)" or any colors with "/ <alpha>".
          if (c.includes("/") && inner) {
            const after = inner.split("/").pop()?.trim() ?? "";
            const a = Number.parseFloat(after);
            return Number.isFinite(a) ? a : 1;
          }

          // Comma-separated rgba(r,g,b,a)
          if (c.toLowerCase().startsWith("rgba(") && inner) {
            const parts = inner.split(",").map((p) => p.trim());
            if (parts.length >= 4) {
              const a = Number.parseFloat(parts[3]);
              return Number.isFinite(a) ? a : 1;
            }
            return 1;
          }

          // rgb(...) or oklab(...) without explicit alpha
          return 1;
        };

        const nav = document.querySelector("nav");
        if (!nav) return null;
        const nodes = [nav, ...Array.from(nav.querySelectorAll("*"))];
        const descriptor = (el) => {
          const cls = norm(el.className);
          const short = cls ? `.${cls.split(" ").filter(Boolean).slice(0, 3).join(".")}` : "";
          return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${short}`;
        };

        const bgCandidates = [];
        const borderCandidates = [];
        for (const el of nodes) {
          const style = getComputedStyle(el);
          const bg = norm(style.backgroundColor);
          const border = norm(style.borderBottomColor);
          const bgAlpha = parseAlpha(bg);
          const borderAlpha = parseAlpha(border);
          const rect = el.getBoundingClientRect();
          if (rect.width < 200 || rect.height < 40) continue;
          const area = rect.width * rect.height;
          if (bgAlpha > 0) bgCandidates.push({ color: bg, area, descriptor: descriptor(el), alpha: bgAlpha });
          if (borderAlpha > 0) borderCandidates.push({ color: border, area, descriptor: descriptor(el), alpha: borderAlpha });
        }
        bgCandidates.sort((a, b) => b.area - a.area);
        borderCandidates.sort((a, b) => b.area - a.area);

        const bg = bgCandidates[0] ?? null;

        const translucentBorders = borderCandidates.filter((c) => c.alpha > 0 && c.alpha < 1);
        const border = (translucentBorders[0] ?? borderCandidates[0]) ?? null;
        if (!bg && !border) return null;
        return {
          backgroundColor: bg?.color ?? "",
          backgroundDescriptor: bg?.descriptor ?? "",
          borderBottomColor: border?.color ?? "",
          borderDescriptor: border?.descriptor ?? "",
        };
      });

      const rootVars = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const pick = (name) => style.getPropertyValue(name).trim();
        return {
          "--color-background": pick("--color-background"),
          "--color-container": pick("--color-container"),
          "--color-gray-border": pick("--color-gray-border"),
          "--font-weight-normal": pick("--font-weight-normal"),
          "--font-weight-medium": pick("--font-weight-medium"),
          "--font-weight-semibold": pick("--font-weight-semibold"),
          "--font-weight-bold": pick("--font-weight-bold"),
          "--default-transition-duration": pick("--default-transition-duration"),
          "--default-transition-timing-function": pick("--default-transition-timing-function"),
        };
      });

      const layoutProbes = await page.evaluate(() => {
        const norm = (s) => (s ?? "").trim();
        const descriptor = (el) => {
          const cls = norm(el.className);
          const short = cls ? `.${cls.split(/\s+/).slice(0, 3).join(".")}` : "";
          return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${short}`;
        };

        const findContainer = () => {
          const nodes = Array.from(document.querySelectorAll("*"));
          const candidates = [];
          for (const el of nodes) {
            const style = getComputedStyle(el);
            const maxWidth = norm(style.maxWidth);
            if (!maxWidth.endsWith("px")) continue;
            const max = Number.parseFloat(maxWidth);
            if (!Number.isFinite(max) || max < 1000) continue;
            const padLeft = norm(style.paddingLeft);
            const pad = Number.parseFloat(padLeft);
            candidates.push({ el, maxWidth, padLeft, pad, area: el.getBoundingClientRect().width * el.getBoundingClientRect().height });
          }
          candidates.sort((a, b) => b.area - a.area);
          const best = candidates.find((c) => c.pad > 0) ?? candidates[0];
          if (!best) return null;
          return {
            descriptor: descriptor(best.el),
            maxWidth: best.maxWidth,
            paddingLeft: best.padLeft,
            paddingRight: norm(getComputedStyle(best.el).paddingRight),
          };
        };

        const findGapNear = (startEl) => {
          let el = startEl;
          while (el) {
            const style = getComputedStyle(el);
            const gap = norm(style.gap);
            if (gap && gap !== "0px" && gap !== "normal") return { gap, descriptor: descriptor(el) };
            el = el.parentElement;
          }
          return null;
        };

        const findResultsLabel = () => {
          const nodes = Array.from(document.querySelectorAll("p,span"));
          return nodes.find((el) => (el.textContent ?? "").trim() === "RESULTS") ?? null;
        };

        const findTrustedGridGap = () => {
          const nodes = Array.from(document.querySelectorAll("section"));
          const section = nodes.find((el) => (el.textContent ?? "").includes("Trusted by innovators"));
          if (!section) return null;
          const inner = Array.from(section.querySelectorAll("*"));
          const candidates = [];
          for (const el of inner) {
            const style = getComputedStyle(el);
            const display = norm(style.display);
            if (!display.includes("grid") && !display.includes("flex")) continue;
            const gap = norm(style.gap);
            const rowGap = norm(style.rowGap);
            const colGap = norm(style.columnGap);
            const resolved =
              gap && gap !== "0px" && gap !== "normal"
                ? gap
                : colGap && colGap !== "0px" && colGap !== "normal"
                  ? colGap
                  : rowGap && rowGap !== "0px" && rowGap !== "normal"
                    ? rowGap
                    : "";
            if (!resolved) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width < 200 || rect.height < 40) continue;
            candidates.push({ resolved, el, area: rect.width * rect.height });
          }
          candidates.sort((a, b) => b.area - a.area);
          const best = candidates[0];
          if (!best) return null;
          return { gap: best.resolved, descriptor: descriptor(best.el) };
        };

        const heroH1 = document.querySelector('section[data-slice-type="hero"] h1');
        const impactH2 = Array.from(document.querySelectorAll("h2")).find((el) => (el.textContent ?? "").trim() === "Impact you can feel") ?? null;
        const serviceItem = document.querySelector(".service-item");
        const serviceGap = serviceItem ? norm(getComputedStyle(serviceItem).gap) : "";

        return {
          container: findContainer(),
          heroStack: heroH1 ? findGapNear(heroH1) : null,
          sectionStack: impactH2 ? findGapNear(impactH2) : null,
          trustedGrid: findTrustedGridGap(),
          resultsLabel: findResultsLabel() ? descriptor(findResultsLabel()) : null,
          serviceItemGap: serviceGap,
        };
      });

      const base = {
        body: await computed(body, ["background-color"]),
        navShell: await computed(navShell, ["background-color", "border-bottom-color"]),
        navProbe,
        heroH1: await computed(heroH1, [
          "color",
          "font-family",
          "font-size",
          "line-height",
          "font-weight",
          "letter-spacing",
        ]),
        heroEyebrow: await computed(heroEyebrow, [
          "color",
          "font-family",
          "font-size",
          "line-height",
          "font-weight",
          "letter-spacing",
          "text-transform",
        ]),
        heroBody: await computed(heroBody, ["color", "font-family", "font-size", "line-height", "font-weight"]),
        bookCall: await computed(bookCall, [
          "background-color",
          "color",
          "border-radius",
          "padding-inline",
          "padding-block",
          "font-family",
          "font-size",
          "font-weight",
          "letter-spacing",
          "text-transform",
          "transition-duration",
          "transition-timing-function",
        ]),
        bookCallHover,
        bookCallFocus: await focusVisibleSnapshot(page, bookCall),
        resultsEyebrow: await computed(resultsEyebrow, [
          "color",
          "font-family",
          "font-size",
          "line-height",
          "font-weight",
          "letter-spacing",
          "text-transform",
        ]),
        impactH2: await computed(impactH2, [
          "color",
          "font-family",
          "font-size",
          "line-height",
          "font-weight",
          "letter-spacing",
        ]),
        serviceH3: await computed(serviceH3, [
          "color",
          "font-family",
          "font-size",
          "line-height",
          "font-weight",
          "letter-spacing",
        ]),
        secondaryButton: await computed(secondaryButton, [
          "background-color",
          "color",
          "border-color",
          "border-width",
          "border-radius",
          "padding-inline",
          "padding-block",
          "height",
          "font-family",
          "font-size",
          "font-weight",
          "letter-spacing",
          "text-transform",
        ]),
        secondaryButtonHover,
        container: await computed(container, ["max-width", "padding-left", "padding-right"]),
        sectionPadding: await computed(sectionPadding, ["padding-top", "padding-bottom"]),
        serviceItem: await computed(serviceItem, [
          "padding",
          "border-top-width",
          "border-top-color",
          "border-bottom-width",
          "border-bottom-color",
          "border-radius",
          "box-shadow",
          "transition-duration",
          "transition-timing-function",
          "transform",
          "background-color",
        ]),
        serviceItemHover,
        gradientOverlay,
        layoutProbes,
        rootVars,
      };

      // Best-effort: find a visible flex/grid container with a non-zero gap to use as grid gap reference.
      const gapCandidate = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll("section *"));
        const visible = (rect) => rect.width > 200 && rect.height > 40 && rect.bottom > 0 && rect.right > 0;
        const norm = (s) => (s ?? "").trim();
        const candidates = [];
        const hasGap = (value) => {
          const v = norm(value);
          if (!v) return false;
          if (v === "0px") return false;
          if (v === "normal") return false;
          return true;
        };
        for (const el of nodes) {
          const style = getComputedStyle(el);
          const display = norm(style.display);
          if (!display.includes("grid") && !display.includes("flex")) continue;
          const rowGap = norm(style.rowGap);
          const colGap = norm(style.columnGap);
          const gap = norm(style.gap);
          if (!hasGap(gap) && !hasGap(rowGap) && !hasGap(colGap)) continue;
          const rect = el.getBoundingClientRect();
          if (!visible(rect)) continue;
          const className = norm(el.className);
          candidates.push({
            tag: el.tagName.toLowerCase(),
            id: el.id ? `#${el.id}` : "",
            className: className ? `.${className.split(/\s+/).slice(0, 3).join(".")}` : "",
            rowGap,
            columnGap: colGap,
            gap,
            area: rect.width * rect.height,
          });
        }
        candidates.sort((a, b) => b.area - a.area);
        return candidates[0] ?? null;
      });

      byViewport.set(vp.name, { ...base, gapCandidate });
      await context.close();
    }

    // Assemble tokens using the mobile/tablet/desktop viewports as the responsive ramps.
    const mobile = byViewport.get("mobile-390x844");
    const tablet = byViewport.get("tablet-834x1112");
    const desktop = byViewport.get("laptop-1280x800");

    const tokens = [];

    const push = (name, value, meta) => {
      const token = { name, value: ensure(value, name), ...meta };
      tokens.push(token);
      collected.set(name, token);
    };

    // Colors
    push("--hx-bg", mobile.body["background-color"], {
      sourceElement: "<body>",
      devtools: "Computed",
      property: "background-color",
    });
    push("--hx-surface-1", ensure(desktop.rootVars["--color-background"], "--color-background"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--color-background",
    });
    push("--hx-surface-2", ensure(desktop.rootVars["--color-container"], "--color-container"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--color-container",
    });
    push("--hx-border", ensure(desktop.rootVars["--color-gray-border"], "--color-gray-border"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--color-gray-border",
    });
    push("--hx-border-muted", desktop.navProbe?.borderBottomColor ?? desktop.navShell["border-bottom-color"], {
      sourceElement: desktop.navProbe?.borderDescriptor
        ? `Nav border (${desktop.navProbe.borderDescriptor})`
        : desktop.navProbe
          ? "Nav border (auto-picked inside <nav>)"
          : "Nav shell (top bar)",
      devtools: "Computed",
      property: "border-bottom-color",
    });
    push("--hx-text", desktop.heroH1.color, {
      sourceElement: "Hero H1 “The space between creativity and code”",
      devtools: "Computed",
      property: "color",
    });
    push("--hx-text-muted", desktop.heroBody.color, {
      sourceElement: "Hero paragraph under H1",
      devtools: "Computed",
      property: "color",
    });
    push("--hx-accent", desktop.bookCall["background-color"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "background-color",
    });
    push("--hx-accent-contrast", desktop.bookCall.color, {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "color",
    });
    push("--hx-focus", desktop.bookCallFocus.outlineColor, {
      sourceElement: "Nav CTA “BOOK A CALL” (focused)",
      devtools: "Computed (focus-visible)",
      property: "outline-color",
    });
    push("--hx-focus-width", desktop.bookCallFocus.outlineWidth, {
      sourceElement: "Nav CTA “BOOK A CALL” (focused)",
      devtools: "Computed (focus-visible)",
      property: "outline-width",
    });
    push("--hx-focus-offset", desktop.bookCallFocus.outlineOffset, {
      sourceElement: "Nav CTA “BOOK A CALL” (focused)",
      devtools: "Computed (focus-visible)",
      property: "outline-offset",
    });
    push("--hx-overlay", desktop.navProbe?.backgroundColor ?? desktop.navShell["background-color"], {
      sourceElement: desktop.navProbe?.backgroundDescriptor
        ? `Nav background (${desktop.navProbe.backgroundDescriptor})`
        : desktop.navProbe
          ? "Nav background (auto-picked inside <nav>)"
          : "Nav shell (top bar)",
      devtools: "Computed",
      property: "background-color",
    });
    if (desktop.gradientOverlay?.backgroundImage) {
      push("--hx-gradient-1", ensure(desktop.gradientOverlay.backgroundImage, "--hx-gradient-1"), {
        sourceElement: `Gradient overlay (${desktop.gradientOverlay.descriptor ?? "auto-detected"})`,
        devtools: "Computed",
        property: "background-image",
      });
    }

    // Typography
    push("--hx-font-sans", desktop.heroBody["font-family"], {
      sourceElement: "Hero paragraph under H1",
      devtools: "Computed",
      property: "font-family",
    });
    push("--hx-font-heading", desktop.heroH1["font-family"], {
      sourceElement: "Hero H1 “The space between creativity and code”",
      devtools: "Computed",
      property: "font-family",
    });
    push("--hx-font-weight-regular", ensure(desktop.rootVars["--font-weight-normal"], "--font-weight-normal"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--font-weight-normal",
    });
    push("--hx-font-weight-medium", ensure(desktop.rootVars["--font-weight-medium"], "--font-weight-medium"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--font-weight-medium",
    });
    push("--hx-font-weight-semibold", ensure(desktop.rootVars["--font-weight-semibold"], "--font-weight-semibold"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--font-weight-semibold",
    });
    push("--hx-font-weight-bold", ensure(desktop.rootVars["--font-weight-bold"], "--font-weight-bold"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--font-weight-bold",
    });
    push("--hx-tracking-eyebrow", desktop.resultsEyebrow["letter-spacing"], {
      sourceElement: "Eyebrow label “RESULTS”",
      devtools: "Computed",
      property: "letter-spacing",
    });
    push("--hx-eyebrow-transform", desktop.resultsEyebrow["text-transform"], {
      sourceElement: "Eyebrow label “RESULTS”",
      devtools: "Computed",
      property: "text-transform",
    });
    push("--hx-h2-tracking", desktop.impactH2["letter-spacing"], {
      sourceElement: "Section H2 “Impact you can feel”",
      devtools: "Computed",
      property: "letter-spacing",
    });
    push("--hx-h3-tracking", desktop.serviceH3["letter-spacing"], {
      sourceElement: "Card-ish H3 “Brand Strategy & Identity”",
      devtools: "Computed",
      property: "letter-spacing",
    });

    // Type scales (responsive)
    push("--hx-h1-size", mobile.heroH1["font-size"], {
      sourceElement: "Hero H1 (mobile)",
      devtools: "Computed",
      property: "font-size",
    });
    push("--hx-h1-line", mobile.heroH1["line-height"], {
      sourceElement: "Hero H1 (mobile)",
      devtools: "Computed",
      property: "line-height",
    });
    push("--hx-h2-size", mobile.impactH2["font-size"], {
      sourceElement: "Section H2 “Impact you can feel” (mobile)",
      devtools: "Computed",
      property: "font-size",
    });
    push("--hx-h2-line", mobile.impactH2["line-height"], {
      sourceElement: "Section H2 “Impact you can feel” (mobile)",
      devtools: "Computed",
      property: "line-height",
    });
    push("--hx-h3-size", mobile.serviceH3["font-size"], {
      sourceElement: "Card-ish H3 “Brand Strategy & Identity” (mobile)",
      devtools: "Computed",
      property: "font-size",
    });
    push("--hx-h3-line", mobile.serviceH3["line-height"], {
      sourceElement: "Card-ish H3 “Brand Strategy & Identity” (mobile)",
      devtools: "Computed",
      property: "line-height",
    });
    push("--hx-body-size", mobile.heroBody["font-size"], {
      sourceElement: "Hero paragraph (mobile)",
      devtools: "Computed",
      property: "font-size",
    });
    push("--hx-body-line", mobile.heroBody["line-height"], {
      sourceElement: "Hero paragraph (mobile)",
      devtools: "Computed",
      property: "line-height",
    });
    push("--hx-small-size", mobile.resultsEyebrow["font-size"], {
      sourceElement: "Eyebrow label “RESULTS” (mobile)",
      devtools: "Computed",
      property: "font-size",
    });
    push("--hx-small-line", mobile.resultsEyebrow["line-height"], {
      sourceElement: "Eyebrow label “RESULTS” (mobile)",
      devtools: "Computed",
      property: "line-height",
    });

    // Layout
    push(
      "--hx-container-max",
      desktop.layoutProbes.container?.maxWidth ?? desktop.container["max-width"],
      {
      sourceElement: desktop.layoutProbes.container?.descriptor ?? "Auto-picked container",
      devtools: "Computed (auto-picked element with max-width >= 1000px)",
      property: "max-width",
      },
    );
    push(
      "--hx-container-pad-x",
      mobile.layoutProbes.container?.paddingLeft ?? mobile.container["padding-left"],
      {
      sourceElement: mobile.layoutProbes.container?.descriptor ?? "Auto-picked container (mobile)",
      devtools: "Computed (auto-picked element with max-width >= 1000px)",
      property: "padding-left",
      },
    );
    push("--hx-section-pad-y", mobile.sectionPadding["padding-top"], {
      sourceElement: "A section with .section-padding (mobile)",
      devtools: "Computed",
      property: "padding-top",
    });

    const gridGapSm = ensure(
      mobile.layoutProbes.trustedGrid?.gap ||
        mobile.gapCandidate?.gap ||
        mobile.gapCandidate?.columnGap ||
        mobile.gapCandidate?.rowGap,
      "grid gap sm",
    );
    const gridGapMd = ensure(
      tablet.layoutProbes.trustedGrid?.gap ||
        tablet.gapCandidate?.gap ||
        tablet.gapCandidate?.columnGap ||
        tablet.gapCandidate?.rowGap,
      "grid gap md",
    );
    const gridGapLg = ensure(
      desktop.layoutProbes.trustedGrid?.gap ||
        desktop.gapCandidate?.gap ||
        desktop.gapCandidate?.columnGap ||
        desktop.gapCandidate?.rowGap,
      "grid gap lg",
    );

    push("--hx-grid-gap-sm", gridGapSm, {
      sourceElement:
        mobile.layoutProbes.trustedGrid?.descriptor ??
        `Auto-picked visible gap container (${mobile.gapCandidate?.tag}${mobile.gapCandidate?.id ?? ""}${mobile.gapCandidate?.className ?? ""})`,
      devtools: "Computed",
      property: "gap/row-gap/column-gap",
    });
    push("--hx-grid-gap-md", gridGapMd, {
      sourceElement:
        tablet.layoutProbes.trustedGrid?.descriptor ??
        `Auto-picked visible gap container (${tablet.gapCandidate?.tag}${tablet.gapCandidate?.id ?? ""}${tablet.gapCandidate?.className ?? ""})`,
      devtools: "Computed",
      property: "gap/row-gap/column-gap",
    });
    push("--hx-grid-gap-lg", gridGapLg, {
      sourceElement:
        desktop.layoutProbes.trustedGrid?.descriptor ??
        `Auto-picked visible gap container (${desktop.gapCandidate?.tag}${desktop.gapCandidate?.id ?? ""}${desktop.gapCandidate?.className ?? ""})`,
      devtools: "Computed",
      property: "gap/row-gap/column-gap",
    });
    push("--hx-card-pad", desktop.serviceItem.padding, {
      sourceElement: "Service block (.service-item)",
      devtools: "Computed",
      property: "padding",
    });

    // Buttons (primary + secondary)
    push("--hx-btn-primary-pad-x", desktop.bookCall["padding-inline"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "padding-inline",
    });
    push("--hx-btn-primary-pad-y", desktop.bookCall["padding-block"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "padding-block",
    });
    push("--hx-btn-primary-font", desktop.bookCall["font-family"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "font-family",
    });
    push("--hx-btn-primary-size", desktop.bookCall["font-size"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "font-size",
    });
    push("--hx-btn-primary-weight", desktop.bookCall["font-weight"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "font-weight",
    });
    push("--hx-btn-primary-tracking", desktop.bookCall["letter-spacing"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "letter-spacing",
    });
    push("--hx-btn-primary-transform", desktop.bookCall["text-transform"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "text-transform",
    });
    push("--hx-btn-primary-bg-hover", ensure(desktop.bookCallHover?.["background-color"], "--hx-btn-primary-bg-hover"), {
      sourceElement: "Nav CTA “BOOK A CALL” (hover)",
      devtools: "Computed (hover)",
      property: "background-color",
    });

    push("--hx-btn-secondary-bg", desktop.secondaryButton["background-color"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "background-color",
    });
    push("--hx-btn-secondary-color", desktop.secondaryButton["color"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "color",
    });
    push("--hx-btn-secondary-border", desktop.secondaryButton["border-color"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "border-color",
    });
    push("--hx-btn-secondary-pad-x", desktop.secondaryButton["padding-inline"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "padding-inline",
    });
    push("--hx-btn-secondary-pad-y", desktop.secondaryButton["padding-block"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "padding-block",
    });
    push("--hx-btn-secondary-height", desktop.secondaryButton["height"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "height",
    });
    push("--hx-btn-secondary-font", desktop.secondaryButton["font-family"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "font-family",
    });
    push("--hx-btn-secondary-size", desktop.secondaryButton["font-size"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "font-size",
    });
    push("--hx-btn-secondary-weight", desktop.secondaryButton["font-weight"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "font-weight",
    });
    push("--hx-btn-secondary-tracking", desktop.secondaryButton["letter-spacing"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "letter-spacing",
    });
    push("--hx-btn-secondary-transform", desktop.secondaryButton["text-transform"], {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "text-transform",
    });
    push("--hx-btn-secondary-bg-hover", ensure(desktop.secondaryButtonHover?.["background-color"], "--hx-btn-secondary-bg-hover"), {
      sourceElement: "Secondary button “EXPLORE OUR WORK” (hover)",
      devtools: "Computed (hover)",
      property: "background-color",
    });
    push("--hx-btn-secondary-color-hover", ensure(desktop.secondaryButtonHover?.color, "--hx-btn-secondary-color-hover"), {
      sourceElement: "Secondary button “EXPLORE OUR WORK” (hover)",
      devtools: "Computed (hover)",
      property: "color",
    });

    // Cards (service blocks hover language)
    const cardBorderWidth =
      desktop.serviceItem["border-top-width"] !== "0px"
        ? desktop.serviceItem["border-top-width"]
        : desktop.serviceItem["border-bottom-width"];
    const cardBorderColor =
      desktop.serviceItem["border-top-width"] !== "0px"
        ? desktop.serviceItem["border-top-color"]
        : desktop.serviceItem["border-bottom-color"];

    push("--hx-card-border", cardBorderColor, {
      sourceElement: "Service block (.service-item)",
      devtools: "Computed",
      property: "border-top-color / border-bottom-color",
    });
    push("--hx-card-border-w", cardBorderWidth, {
      sourceElement: "Service block (.service-item)",
      devtools: "Computed",
      property: "border-top-width / border-bottom-width",
    });
    push("--hx-card-bg", desktop.serviceItem["background-color"], {
      sourceElement: "Service block (.service-item)",
      devtools: "Computed",
      property: "background-color",
    });
    push("--hx-card-bg-hover", ensure(desktop.serviceItemHover?.["background-color"], "--hx-card-bg-hover"), {
      sourceElement: "Service block (.service-item) (hover)",
      devtools: "Computed (hover)",
      property: "background-color",
    });

    // Common vertical rhythm (picked from existing computed gaps in the hero and section headers)
    push("--hx-stack-1", ensure(desktop.layoutProbes.heroStack?.gap, "--hx-stack-1"), {
      sourceElement: desktop.layoutProbes.heroStack?.descriptor ?? "Hero stack wrapper",
      devtools: "Computed",
      property: "gap",
    });
    push("--hx-stack-2", ensure(desktop.layoutProbes.sectionStack?.gap, "--hx-stack-2"), {
      sourceElement: desktop.layoutProbes.sectionStack?.descriptor ?? "Section header stack wrapper",
      devtools: "Computed",
      property: "gap",
    });
    push("--hx-stack-3", ensure(desktop.layoutProbes.serviceItemGap, "--hx-stack-3"), {
      sourceElement: "Service block (.service-item) content stack",
      devtools: "Computed",
      property: "gap",
    });

    // Shape/Elevation
    push("--hx-radius-card", desktop.serviceItem["border-radius"], {
      sourceElement: "Service block (.service-item)",
      devtools: "Computed",
      property: "border-radius",
    });
    push("--hx-radius-btn", desktop.bookCall["border-radius"], {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "border-radius",
    });
    push("--hx-border-w", ensure(desktop.secondaryButton["border-width"], "--hx-border-w"), {
      sourceElement: "Secondary button “EXPLORE OUR WORK”",
      devtools: "Computed",
      property: "border-width",
    });
    push("--hx-shadow-card", desktop.serviceItem["box-shadow"], {
      sourceElement: "Service block (.service-item)",
      devtools: "Computed",
      property: "box-shadow",
    });

    // Hover shadow variant (derived from the same card-like element)
    push("--hx-shadow-card-hover", desktop.serviceItem["box-shadow"], {
      sourceElement: "Service block (.service-item) (hover state uses background/clip, no distinct shadow)",
      devtools: "Computed",
      property: "box-shadow",
    });
    push("--hx-shadow-focus", desktop.bookCallFocus.boxShadow, {
      sourceElement: "Nav CTA “BOOK A CALL” (focused)",
      devtools: "Computed (focus-visible)",
      property: "box-shadow",
    });

    // Motion
    push("--hx-ease", ensure(desktop.rootVars["--default-transition-timing-function"], "--default-transition-timing-function"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--default-transition-timing-function",
    });
    push("--hx-dur-1", ensure(desktop.rootVars["--default-transition-duration"], "--default-transition-duration"), {
      sourceElement: ":root CSS variable",
      devtools: "Computed → documentElement",
      property: "--default-transition-duration",
    });
    push("--hx-dur-2", ensure(desktop.bookCall["transition-duration"], "--hx-dur-2"), {
      sourceElement: "Nav CTA “BOOK A CALL”",
      devtools: "Computed",
      property: "transition-duration",
    });

    // Hover lift: if card-like element uses transform on hover; otherwise capture the base transform.
    push("--hx-hover-lift", desktop.serviceItem.transform === "none" ? "0px" : desktop.serviceItem.transform, {
      sourceElement: "Service block (.service-item) (hover transform reference)",
      devtools: "Computed",
      property: "transform",
    });

    // Validate there are no TBDs.
    for (const token of tokens) {
      if (token.value === "TBD") throw new Error(`Token left as TBD: ${token.name}`);
    }

    // Compose CSS with responsive overrides for tokens that change across viewports.
    const responsive = {
      tablet: {},
      desktop: {},
    };

    const responsivePairs = [
      ["--hx-container-pad-x", {
        mobile: mobile.layoutProbes.container?.paddingLeft ?? mobile.container["padding-left"],
        tablet: tablet.layoutProbes.container?.paddingLeft ?? tablet.container["padding-left"],
        desktop: desktop.layoutProbes.container?.paddingLeft ?? desktop.container["padding-left"],
      }],
      ["--hx-section-pad-y", { mobile: mobile.sectionPadding["padding-top"], tablet: tablet.sectionPadding["padding-top"], desktop: desktop.sectionPadding["padding-top"] }],
      ["--hx-h1-size", { mobile: mobile.heroH1["font-size"], tablet: tablet.heroH1["font-size"], desktop: desktop.heroH1["font-size"] }],
      ["--hx-h1-line", { mobile: mobile.heroH1["line-height"], tablet: tablet.heroH1["line-height"], desktop: desktop.heroH1["line-height"] }],
      ["--hx-h2-size", { mobile: mobile.impactH2["font-size"], tablet: tablet.impactH2["font-size"], desktop: desktop.impactH2["font-size"] }],
      ["--hx-h2-line", { mobile: mobile.impactH2["line-height"], tablet: tablet.impactH2["line-height"], desktop: desktop.impactH2["line-height"] }],
      ["--hx-h3-size", { mobile: mobile.serviceH3["font-size"], tablet: tablet.serviceH3["font-size"], desktop: desktop.serviceH3["font-size"] }],
      ["--hx-h3-line", { mobile: mobile.serviceH3["line-height"], tablet: tablet.serviceH3["line-height"], desktop: desktop.serviceH3["line-height"] }],
      ["--hx-body-size", { mobile: mobile.heroBody["font-size"], tablet: tablet.heroBody["font-size"], desktop: desktop.heroBody["font-size"] }],
      ["--hx-body-line", { mobile: mobile.heroBody["line-height"], tablet: tablet.heroBody["line-height"], desktop: desktop.heroBody["line-height"] }],
      ["--hx-small-size", { mobile: mobile.resultsEyebrow["font-size"], tablet: tablet.resultsEyebrow["font-size"], desktop: desktop.resultsEyebrow["font-size"] }],
      ["--hx-small-line", { mobile: mobile.resultsEyebrow["line-height"], tablet: tablet.resultsEyebrow["line-height"], desktop: desktop.resultsEyebrow["line-height"] }],
    ];

    for (const [name, values] of responsivePairs) {
      if (values.tablet !== values.mobile) responsive.tablet[name] = ensure(values.tablet, `${name} tablet`);
      if (values.desktop !== values.tablet) responsive.desktop[name] = ensure(values.desktop, `${name} desktop`);
    }

    const cssLines = [
      ":root {",
      formatTokenSection(
        "Colors",
        tokens
          .filter((t) => t.name.startsWith("--hx-") && [
            "--hx-bg",
            "--hx-surface-1",
            "--hx-surface-2",
            "--hx-border",
            "--hx-border-muted",
            "--hx-text",
            "--hx-text-muted",
            "--hx-accent",
            "--hx-accent-contrast",
            "--hx-focus",
            "--hx-overlay",
            "--hx-gradient-1",
          ].includes(t.name))
          .map((t) => [t.name, t.value]),
      ),
      "",
      formatTokenSection(
        "Typography",
        tokens
          .filter((t) => t.name.startsWith("--hx-") && [
            "--hx-font-sans",
            "--hx-font-heading",
            "--hx-font-weight-regular",
            "--hx-font-weight-medium",
            "--hx-font-weight-semibold",
            "--hx-font-weight-bold",
            "--hx-tracking-eyebrow",
            "--hx-eyebrow-transform",
            "--hx-h2-tracking",
            "--hx-h3-tracking",
            "--hx-h1-size",
            "--hx-h1-line",
            "--hx-h2-size",
            "--hx-h2-line",
            "--hx-h3-size",
            "--hx-h3-line",
            "--hx-body-size",
            "--hx-body-line",
            "--hx-small-size",
            "--hx-small-line",
          ].includes(t.name))
          .map((t) => [t.name, t.value]),
      ),
      "",
      formatTokenSection(
        "Layout",
        tokens
          .filter((t) => t.name.startsWith("--hx-") && [
            "--hx-container-max",
            "--hx-container-pad-x",
            "--hx-section-pad-y",
            "--hx-grid-gap-lg",
            "--hx-grid-gap-md",
            "--hx-grid-gap-sm",
            "--hx-card-pad",
            "--hx-stack-1",
            "--hx-stack-2",
            "--hx-stack-3",
          ].includes(t.name))
          .map((t) => [t.name, t.value]),
      ),
      "",
      formatTokenSection(
        "Components",
        tokens
          .filter((t) => t.name.startsWith("--hx-") && [
            "--hx-focus-width",
            "--hx-focus-offset",
            "--hx-btn-primary-pad-x",
            "--hx-btn-primary-pad-y",
            "--hx-btn-primary-font",
            "--hx-btn-primary-size",
            "--hx-btn-primary-weight",
            "--hx-btn-primary-tracking",
            "--hx-btn-primary-transform",
            "--hx-btn-primary-bg-hover",
            "--hx-btn-secondary-bg",
            "--hx-btn-secondary-color",
            "--hx-btn-secondary-border",
            "--hx-btn-secondary-pad-x",
            "--hx-btn-secondary-pad-y",
            "--hx-btn-secondary-height",
            "--hx-btn-secondary-font",
            "--hx-btn-secondary-size",
            "--hx-btn-secondary-weight",
            "--hx-btn-secondary-tracking",
            "--hx-btn-secondary-transform",
            "--hx-btn-secondary-bg-hover",
            "--hx-btn-secondary-color-hover",
            "--hx-card-border",
            "--hx-card-border-w",
            "--hx-card-bg",
            "--hx-card-bg-hover",
          ].includes(t.name))
          .map((t) => [t.name, t.value]),
      ),
      "",
      formatTokenSection(
        "Shape/Elevation",
        tokens
          .filter((t) => t.name.startsWith("--hx-") && [
            "--hx-radius-card",
            "--hx-radius-btn",
            "--hx-border-w",
            "--hx-shadow-card",
            "--hx-shadow-card-hover",
            "--hx-shadow-focus",
          ].includes(t.name))
          .map((t) => [t.name, t.value]),
      ),
      "",
      formatTokenSection(
        "Motion",
        tokens
          .filter((t) => t.name.startsWith("--hx-") && ["--hx-dur-1", "--hx-dur-2", "--hx-ease", "--hx-hover-lift"].includes(t.name))
          .map((t) => [t.name, t.value]),
      ),
      "}",
      "",
    ];

    for (const bp of BREAKPOINTS) {
      const set = responsive[bp.name];
      const keys = Object.keys(set);
      if (!keys.length) continue;
      cssLines.push(`@media (min-width: ${bp.minWidth}px) {`);
      cssLines.push("  :root {");
      for (const key of keys) cssLines.push(`    ${key}: ${set[key]};`);
      cssLines.push("  }");
      cssLines.push("}");
      cssLines.push("");
    }

    await fs.writeFile(outCss, cssLines.join("\n"), "utf8");

    const notes = [
      "# Hatamex token extraction notes",
      "",
      `Source: ${SOURCE_URL}`,
      "",
      "All values were extracted from Chrome DevTools-equivalent “Computed” styles via Playwright.",
      "",
      "## Tokens",
      "",
      ...tokens.map(toMdToken),
      "",
    ].join("\n");

    await fs.writeFile(outNotes, notes, "utf8");

    console.log(`Wrote ${tokens.length} tokens to ${outCss}`);
    console.log(`Wrote extraction notes to ${outNotes}`);
  } finally {
    await browser.close();
  }
}

await main();
