(() => {
  const themeParam = new URLSearchParams(window.location.search).get("theme");
  if (themeParam && /^[a-z0-9-]+$/i.test(themeParam)) {
    document.documentElement.dataset.theme = themeParam;
  }

  const assetsParam = new URLSearchParams(window.location.search).get("assets");
  const ASSET_MODE = assetsParam === "placeholder" ? "placeholder" : "remote";

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function enableRemoteAssets() {
    for (const img of document.querySelectorAll("img[data-remote-src]")) {
      const src = img.getAttribute("data-remote-src");
      if (src) img.setAttribute("src", src);
      const srcset = img.getAttribute("data-remote-srcset");
      if (srcset) img.setAttribute("srcset", srcset);
    }

    for (const video of document.querySelectorAll("video[data-remote-poster]")) {
      const poster = video.getAttribute("data-remote-poster");
      if (poster) video.setAttribute("poster", poster);
      for (const source of video.querySelectorAll("source[data-remote-src]")) {
        const src = source.getAttribute("data-remote-src");
        if (src) source.setAttribute("src", src);
      }
      try {
        video.load();
      } catch {}
    }

    for (const iframe of document.querySelectorAll("iframe[data-remote-src]")) {
      const src = iframe.getAttribute("data-remote-src");
      if (src) iframe.setAttribute("src", src);
    }
  }

  function lockScroll(locked) {
    const body = document.body;
    if (!body) return;
    if (!locked) {
      body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }
    body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }

  function setAppShellVisible() {
    const appShell = document.getElementById("app-shell");
    if (!appShell) return;
    appShell.classList.remove("opacity-0", "blur-xl");
    appShell.classList.add("opacity-100", "blur-0");
  }

  function initNavMotion() {
    const nav = document.getElementById("site-nav");
    if (!(nav instanceof HTMLElement)) return;

    const desktopMq = window.matchMedia?.("(min-width: 1024px)") ?? null;
    const easeMenu = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    const motionDurationMs = 350;

    let isCondensed = false;
    let lastScrollY = window.scrollY;
    let ticking = false;

    let widthAnim = null;
    let topAnim = null;

    const cancelAnim = (anim) => {
      try {
        anim?.cancel();
      } catch {}
    };

    const apply = (nextCondensed, { immediate = false } = {}) => {
      const isDesktop = desktopMq ? desktopMq.matches : window.innerWidth >= 1024;
      const condensed = Boolean(isDesktop && nextCondensed);
      const targetWidth = condensed ? "80%" : "100%";
      const targetTop = condensed ? "16px" : "0px";

      if (immediate || prefersReducedMotion) {
        cancelAnim(widthAnim);
        cancelAnim(topAnim);
        widthAnim = null;
        topAnim = null;
        nav.style.width = targetWidth;
        nav.style.top = targetTop;
        return;
      }

      const rect = nav.getBoundingClientRect();
      const fromWidthPct = window.innerWidth ? (rect.width / window.innerWidth) * 100 : condensed ? 80 : 100;
      const fromTopPx = rect.y;

      cancelAnim(widthAnim);
      cancelAnim(topAnim);

      widthAnim = nav.animate(
        [{ width: `${fromWidthPct}%` }, { width: targetWidth }],
        { duration: motionDurationMs, easing: easeMenu, fill: "forwards" },
      );
      topAnim = nav.animate(
        [{ top: `${fromTopPx}px` }, { top: targetTop }],
        { duration: motionDurationMs, easing: easeMenu, fill: "forwards" },
      );

      const localWidthAnim = widthAnim;
      const localTopAnim = topAnim;

      void Promise.allSettled([localWidthAnim.finished, localTopAnim.finished]).then(() => {
        nav.style.width = targetWidth;
        nav.style.top = targetTop;
        cancelAnim(localWidthAnim);
        cancelAnim(localTopAnim);
        if (widthAnim === localWidthAnim) widthAnim = null;
        if (topAnim === localTopAnim) topAnim = null;
      });
    };

    const update = () => {
      ticking = false;

      const y = window.scrollY;
      const threshold = window.innerHeight * 0.2;
      if (y > lastScrollY && y > threshold) isCondensed = true;
      else if (y < lastScrollY) isCondensed = false;

      lastScrollY = y;
      apply(isCondensed);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    const onResize = () => {
      apply(isCondensed, { immediate: true });
    };

    apply(false, { immediate: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    desktopMq?.addEventListener?.("change", onResize);
  }

  function hidePreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return;
    preloader.classList.remove("opacity-100");
    preloader.classList.add("opacity-0");
    preloader.style.pointerEvents = "none";
    window.setTimeout(() => preloader.remove(), 350);
  }

  function animate(el, keyframes, options) {
    if (!el) return Promise.resolve();
    if (prefersReducedMotion) {
      const last = keyframes[keyframes.length - 1];
      for (const [key, value] of Object.entries(last)) el.style[key] = value;
      return Promise.resolve();
    }
    try {
      const anim = el.animate(keyframes, { fill: "forwards", ...options });
      return anim.finished.catch(() => {});
    } catch {
      const last = keyframes[keyframes.length - 1];
      for (const [key, value] of Object.entries(last)) el.style[key] = value;
      return Promise.resolve();
    }
  }

  function animateWithEasingFn(el, keyframes, { duration, easingFn }) {
    if (!el) return Promise.resolve();
    if (prefersReducedMotion) {
      const last = keyframes[keyframes.length - 1];
      for (const [key, value] of Object.entries(last)) el.style[key] = value;
      return Promise.resolve();
    }

    let animation;
    try {
      animation = el.animate(keyframes, { duration, easing: "linear", fill: "forwards" });
      animation.pause();
    } catch {
      return animate(el, keyframes, { duration, easing: "linear" });
    }

    const start = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const raw = Math.min(1, (now - start) / duration);
        const eased = easingFn(raw);
        try {
          animation.currentTime = eased * duration;
        } catch {}

        if (raw >= 1) {
          try {
            animation.finish();
          } catch {}
          resolve();
          return;
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function springSolve(from, to, tSeconds, config) {
    const stiffness = config?.stiffness ?? 100;
    const damping = config?.damping ?? 60;
    const mass = config?.mass ?? 1;
    const v0 = config?.velocity ?? 0;

    const x = from - to;
    const w0 = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));

    if (zeta < 1) {
      const w1 = w0 * Math.sqrt(1 - zeta * zeta);
      const envelope = Math.exp(-zeta * w0 * tSeconds);
      const b = (v0 + zeta * w0 * x) / w1;
      const wt = w1 * tSeconds;
      const cos = Math.cos(wt);
      const sin = Math.sin(wt);
      const value = to + envelope * (x * cos + b * sin);
      const velocity =
        envelope *
        (-zeta * w0 * (x * cos + b * sin) + (-x * w1 * sin + b * w1 * cos));
      return { value, velocity };
    }

    if (zeta === 1) {
      const envelope = Math.exp(-w0 * tSeconds);
      const value = to + envelope * (x + (v0 + w0 * x) * tSeconds);
      const velocity = envelope * (v0 - w0 * (v0 + w0 * x) * tSeconds);
      return { value, velocity };
    }

    const sqrtTerm = Math.sqrt(zeta * zeta - 1);
    const r1 = -w0 * (zeta - sqrtTerm);
    const r2 = -w0 * (zeta + sqrtTerm);
    const c1 = (v0 - r2 * x) / (r1 - r2);
    const c2 = x - c1;

    const exp1 = Math.exp(r1 * tSeconds);
    const exp2 = Math.exp(r2 * tSeconds);
    const value = to + c1 * exp1 + c2 * exp2;
    const velocity = c1 * r1 * exp1 + c2 * r2 * exp2;
    return { value, velocity };
  }

  function animateSpring({ from, to, onUpdate, config }) {
    const restDelta = config?.restDelta ?? 0.001;
    const restSpeed = config?.restSpeed ?? 0.01;
    const start = performance.now();

    return new Promise((resolve) => {
      const tick = (now) => {
        const tSeconds = (now - start) / 1000;
        const { value, velocity } = springSolve(from, to, tSeconds, config);
        onUpdate?.(value);

        const done = Math.abs(to - value) <= restDelta && Math.abs(velocity) <= restSpeed;
        if (done) {
          onUpdate?.(to);
          resolve();
          return;
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  }

  async function runPreloader() {
    const preloader = document.getElementById("preloader");
    const appShell = document.getElementById("app-shell");
    const nav = document.getElementById("site-nav");
    if (!preloader || !appShell) return;

    const brandIconWrapper = preloader.querySelector(".brand-icon-wrapper");
    const brandIcon = preloader.querySelector(".brand-icon");
    const brandTypefaceWrapper = preloader.querySelector(".brand-typeface-wrapper");
    const brandTypeface = preloader.querySelector(".brand-typeface");
    const progressFill = preloader.querySelector(".loading-progress");
    const progressTrack = progressFill?.parentElement ?? null;
    const counter = preloader.querySelector(".counter");
    const counterText = counter?.querySelector("h5") ?? null;
    const logoContainer = preloader.querySelector(".logo-container");

    const shouldSkip = prefersReducedMotion || sessionStorage.getItem("preloaderPlayed") === "true";
    if (shouldSkip) {
      setAppShellVisible();
      if (nav) {
        nav.style.opacity = "1";
        nav.style.transform = "none";
      }
      hidePreloader();
      lockScroll(false);
      return;
    }

    lockScroll(true);

    const easeHop = "cubic-bezier(0.9, 0, 0.1, 1)";
    const easeDefault = "cubic-bezier(0.4, 0, 0.2, 1)";

    // Match live GSAP timeline: delay 0.3s + 0.65s hold.
    await wait(950);

    const iconReveal = Promise.all([
      animate(
        brandIconWrapper,
        [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
        { duration: 600, easing: easeHop },
      ),
      animate(
        brandIcon,
        [
          { transform: "translateY(-120%)", opacity: 0 },
          { transform: "translateY(0%)", opacity: 1 },
        ],
        { duration: 600, easing: easeHop },
      ),
    ]);

    const fadeIns = (async () => {
      await wait(200);
      await Promise.all([
        animate(progressTrack, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: easeHop }),
        animateWithEasingFn(counter, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easingFn: easeOutQuad }),
      ]);
    })();

    await Promise.all([iconReveal, fadeIns]);

    if (progressFill) progressFill.classList.add("animate-progress-fill");

    let rafId = 0;
    const progressDuration = 2000;
    const progressStart = performance.now();
    await new Promise((resolve) => {
      const tick = (now) => {
        const raw = Math.min(1, (now - progressStart) / progressDuration);
        const eased = easeInOutQuad(raw);
        const pct = Math.floor(eased * 100);
        if (counterText) counterText.textContent = `${pct}%`;
        if (raw >= 1) {
          resolve();
          return;
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    });

    await Promise.all([
      animate(counter, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: easeHop }),
      animate(progressTrack, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: easeHop }),
    ]);

    if (rafId) cancelAnimationFrame(rafId);

    if (brandTypefaceWrapper && brandTypeface && logoContainer) {
      const computedWidth = Number.parseFloat(getComputedStyle(brandTypeface).width);
      const targetWidth =
        Number.isFinite(computedWidth) && computedWidth > 0 ? computedWidth : brandTypeface.getBoundingClientRect().width;

      await Promise.all([
        animateWithEasingFn(
          brandTypefaceWrapper,
          [
            { width: "0px", clipPath: "inset(0 100% 0 0)" },
            { width: `${targetWidth}px`, clipPath: "inset(0 0% 0 0)" },
          ],
          { duration: 800, easingFn: easeOutCubic },
        ),
        animateWithEasingFn(brandTypeface, [{ opacity: 0 }, { opacity: 1 }], {
          duration: 800,
          easingFn: easeOutCubic,
        }),
      ]);
    }

    await wait(400);

    if (logoContainer) {
      await animate(
        logoContainer,
        [{ filter: "blur(0px)", opacity: 1 }, { filter: "blur(10px)", opacity: 0 }],
        { duration: 600, easing: easeHop },
      );
    }

    // Live: +0.1s +0.5s before triggering overlay fade.
    await wait(600);

    const overlayFade = animate(preloader, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: easeDefault });
    preloader.style.pointerEvents = "none";

    await wait(100);
    sessionStorage.setItem("preloaderPlayed", "true");

    // Reveal app while preloader fades.
    setAppShellVisible();

    if (nav) {
      const easeMenu = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      const yAnim = nav.animate(
        [{ transform: "translateY(-100px)" }, { transform: "translateY(0px)" }],
        { duration: 400, easing: easeMenu, fill: "forwards" },
      );
      const opacityAnim = nav.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 250, easing: "ease-in-out", fill: "forwards" },
      );
      void Promise.allSettled([yAnim.finished, opacityAnim.finished]).then(() => {
        nav.style.opacity = "1";
        nav.style.transform = "none";
        try {
          yAnim.cancel();
          opacityAnim.cancel();
        } catch {}
      });
    }

    await overlayFade;
    preloader.remove();
    lockScroll(false);
  }

  function splitLines(el) {
    if (!(el instanceof HTMLElement)) return;
    if (el.dataset.splitLines === "true") return;
    if (el.children.length > 0) return;

    const rawText = el.textContent ?? "";
    const text = rawText.replace(/\s+/g, " ").trim();
    if (!text) return;

    el.dataset.splitLines = "true";
    el.setAttribute("aria-label", text);
    el.textContent = "";

    const words = text.split(" ");
    const wordSpans = words.map((word, i) => {
      const span = document.createElement("span");
      span.style.display = "inline-block";
      span.style.whiteSpace = "pre";
      span.textContent = word + (i < words.length - 1 ? " " : "");
      el.appendChild(span);
      return span;
    });

    // Force layout
    void el.offsetWidth;

    const lines = [];
    let current = [];
    let currentTop = wordSpans[0]?.offsetTop ?? 0;

    for (const span of wordSpans) {
      const top = span.offsetTop;
      if (Math.abs(top - currentTop) > 1) {
        lines.push(current);
        current = [];
        currentTop = top;
      }
      current.push(span);
    }
    if (current.length) lines.push(current);

    const textAlign = getComputedStyle(el).textAlign;
    el.textContent = "";

    lines.forEach((spans, idx) => {
      const mask = document.createElement("div");
      mask.className = `line-mask line${idx + 1}-mask`;
      mask.setAttribute("aria-hidden", "true");
      mask.style.textAlign = textAlign;

      const line = document.createElement("div");
      line.className = `line line${idx + 1}`;
      line.setAttribute("aria-hidden", "true");
      line.style.textAlign = textAlign;
      line.style.transition = `transform 800ms var(--hx-ease-out)`;
      line.style.transitionDelay = `${idx * 70}ms`;
      line.textContent = spans.map((s) => s.textContent).join("");

      mask.appendChild(line);
      el.appendChild(mask);
    });
  }

  function initLineSplitting() {
    const candidates = document.querySelectorAll("main h1, main h2, main h3, main p, main span");
    for (const el of candidates) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.dataset.splitLines === "true") continue;
      if (el.querySelector(".line-mask")) continue;
      if (el.children.length > 0) continue;

      const parentStyle = el.parentElement?.getAttribute("style") ?? "";
      const shouldSplit =
        el.classList.contains("overflow-hidden") ||
        parentStyle.includes("width:fit-content") ||
        parentStyle.includes("width: fit-content");

      if (!shouldSplit) continue;
      splitLines(el);
    }
  }

  function initScrollReveals() {
    const revealables = Array.from(document.querySelectorAll("main [data-split-lines=\"true\"]"));
    if (revealables.length === 0) return;

    const reveal = (el) => el.classList.add("reveal-in");

    if (prefersReducedMotion) {
      for (const el of revealables) reveal(el);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      },
      { root: null, threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    for (const el of revealables) io.observe(el);
  }

  function initManifestoReveal() {
    // Live (Framer Motion):
    // - `useScroll({ target: paragraphRef, offset: ["start 0.9", "start 0.25"] })`
    // - words split by spaces, then characters split per word
    // - each character uses `useTransform(progress, [start,end], [0,1])`
    const section = document.querySelector('section[data-slice-type="services_overview"]');
    if (!section) return;

    const paragraph = section.querySelector("p.flex-wrap");
    if (!(paragraph instanceof HTMLElement)) return;

    const wordSpans = Array.from(paragraph.querySelectorAll(":scope > span.relative.font-rinter"));
    if (wordSpans.length === 0) return;

    const characters = [];
    const wordCount = wordSpans.length;

    for (const [wordIndex, wordSpan] of wordSpans.entries()) {
      const charWrappers = Array.from(wordSpan.children).filter((n) => n instanceof HTMLElement);
      const charCount = charWrappers.length;
      if (charCount === 0) continue;

      for (const [charIndex, wrapper] of charWrappers.entries()) {
        if (!(wrapper instanceof HTMLElement)) continue;
        const children = Array.from(wrapper.children);
        const overlay = children.find((el) => {
          if (!(el instanceof HTMLElement)) return false;
          const style = el.getAttribute("style") ?? "";
          return /opacity\s*:\s*0/.test(style);
        });
        if (!(overlay instanceof HTMLElement)) continue;
        const wordStart = wordIndex / wordCount;
        const wordEnd = wordStart + 1 / wordCount;
        const charStep = (wordEnd - wordStart) / charCount;
        const start = wordStart + charIndex * charStep;
        const end = start + charStep;
        characters.push({ start, end, el: overlay });
      }
    }

    if (characters.length === 0) return;

    const setAll = (value) => {
      for (const c of characters) c.el.style.opacity = value;
    };

    if (prefersReducedMotion) {
      setAll("1");
      return;
    }

    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const computeScrollProgress = () => {
      const vh = window.innerHeight || 1;
      const startPx = 0.9 * vh;
      const endPx = 0.25 * vh;
      const top = paragraph.getBoundingClientRect().top;
      return clamp01((startPx - top) / (startPx - endPx));
    };

    let raf = 0;
    let lastBucket = -1;

    const update = () => {
      raf = 0;
      const progress = computeScrollProgress();
      const bucket = Math.floor(progress * 10000);
      if (bucket === lastBucket) return;
      lastBucket = bucket;

      for (const c of characters) {
        const local = clamp01((progress - c.start) / (c.end - c.start));
        c.el.style.opacity = `${local}`;
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    // Some browsers restore scroll position after our initial run without reliably
    // dispatching a scroll event; keep the first second “warm” so the text becomes visible.
    let warmFrames = 0;
    const warm = () => {
      warmFrames += 1;
      update();
      if (warmFrames < 60) requestAnimationFrame(warm);
    };
    requestAnimationFrame(warm);
    window.addEventListener("pageshow", schedule, { passive: true });
  }

  function initKpiCounters() {
    const section = document.querySelector('section[data-slice-type="achievements"]');
    if (!section) return;

    const blocks = Array.from(section.querySelectorAll("div.bg-white.flex-1"));
    if (blocks.length === 0) return;

    const targetsByLabel = [
      { match: "Clients who stay", value: 95 },
      { match: "Conversion growth", value: 40 },
      { match: "Reliable, secure systems", value: 99 },
    ];

    const kpis = blocks
      .map((block) => {
        const number = block.querySelector("span.font-title");
        const label = block.querySelector("p");
        if (!number || !label) return null;
        const labelText = (label.textContent ?? "").trim();
        const target = targetsByLabel.find((t) => labelText.includes(t.match))?.value;
        if (!target) return null;
        return { number, target };
      })
      .filter(Boolean);

    if (kpis.length === 0) return;

    const run = () => {
      const config = {
        damping: 60,
        stiffness: 100,
        restDelta: 0.001,
        restSpeed: 0.01,
        velocity: 0,
      };

      for (const { number, target } of kpis) {
        void animateSpring({
          from: 0,
          to: target,
          config,
          onUpdate: (value) => {
            number.textContent = `${Math.round(value)}%`;
          },
        });
      }
    };

    if (prefersReducedMotion) {
      for (const { number, target } of kpis) number.textContent = `${target}%`;
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        run();
        io.disconnect();
      },
      { threshold: 0.35 },
    );

    io.observe(section);
  }

  function initServicesHover() {
    const section = document.querySelector('section[data-slice-type="services_accordion"]');
    if (!section) return;

    const images = Array.from(section.querySelectorAll("[data-service-image]"));
    if (images.length) {
      for (const img of images) {
        img.style.transition = `clip-path 600ms var(--hx-ease-default)`;
      }

      const hideAll = () => {
        for (const img of images) img.style.clipPath = "inset(0% 0% 100% 0%)";
      };

      hideAll();

      const rows = Array.from(section.querySelectorAll("a.group"));
      for (const row of rows) {
        row.addEventListener("mouseenter", () => {
          hideAll();
          const img = row.querySelector("[data-service-image]");
          if (img) img.style.clipPath = "inset(0% 0% 0% 0%)";
        });
      }
    }

    // Mobile accordion
    const mobileItems = Array.from(section.querySelectorAll(".lg\\:hidden.border-b-\\[0\\.5px\\]"));
    for (const item of mobileItems) {
      const header = item.querySelector(".cursor-pointer");
      const grid = item.querySelector(".grid");
      const body = item.querySelector(".overflow-hidden");
      const icon = header?.querySelector("svg")?.parentElement ?? null;
      if (!(header instanceof HTMLElement) || !(grid instanceof HTMLElement) || !(body instanceof HTMLElement)) continue;

      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.setAttribute("aria-expanded", "false");

      const setOpen = (open) => {
        header.setAttribute("aria-expanded", open ? "true" : "false");
        grid.style.gridTemplateRows = open ? "1fr" : "0fr";
        const inner = body.querySelector(".flex");
        if (inner instanceof HTMLElement) inner.style.opacity = open ? "1" : "0";
        if (icon instanceof HTMLElement) icon.style.transform = open ? "rotate(45deg)" : "rotate(0deg)";
      };

      const toggle = () => setOpen(header.getAttribute("aria-expanded") !== "true");

      header.addEventListener("click", toggle);
      header.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    }
  }

  function initCasesSlider() {
    const section = document.querySelector('section[data-slice-type="case_studies_showcase"]');
    if (!section) return;
    const slider = section.querySelector(".keen-slider");
    if (!(slider instanceof HTMLElement)) return;

    const slides = Array.from(slider.querySelectorAll(".keen-slider__slide")).filter(
      (el) => el instanceof HTMLElement,
    );
    if (slides.length === 0) return;

    slider.style.overflowX = "auto";
    slider.style.overflowY = "hidden";
    slider.style.scrollSnapType = "x mandatory";
    slider.style.scrollBehavior = prefersReducedMotion ? "auto" : "smooth";
    slider.style.webkitOverflowScrolling = "touch";

    for (const slide of slides) {
      slide.style.scrollSnapAlign = "start";
    }

    const prevButton = section.querySelector('button[aria-label="Previous slide"]');
    const nextButton = section.querySelector('button[aria-label="Next slide"]');

    const computeStep = () => {
      const first = slides[0];
      const second = slides[1];
      const w1 = first.getBoundingClientRect().width;
      if (!second) return w1;
      const leftGap = second.offsetLeft - first.offsetLeft - w1;
      return w1 + Math.max(0, leftGap);
    };

    const updateButtons = () => {
      if (!(prevButton instanceof HTMLButtonElement) || !(nextButton instanceof HTMLButtonElement)) return;
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      const x = slider.scrollLeft;
      prevButton.disabled = x <= 2;
      nextButton.disabled = x >= maxScroll - 2;
      prevButton.classList.toggle("opacity-30", prevButton.disabled);
      prevButton.classList.toggle("cursor-not-allowed", prevButton.disabled);
      nextButton.classList.toggle("opacity-30", nextButton.disabled);
      nextButton.classList.toggle("cursor-not-allowed", nextButton.disabled);
    };

    const scrollByStep = (dir) => {
      const step = computeStep();
      slider.scrollBy({ left: dir * step, behavior: prefersReducedMotion ? "auto" : "smooth" });
    };

    if (prevButton instanceof HTMLButtonElement) prevButton.addEventListener("click", () => scrollByStep(-1));
    if (nextButton instanceof HTMLButtonElement) nextButton.addEventListener("click", () => scrollByStep(1));

    slider.addEventListener("scroll", () => updateButtons(), { passive: true });
    window.addEventListener("resize", () => updateButtons(), { passive: true });
    updateButtons();
  }

  function initMobileNav() {
    const nav = document.getElementById("site-nav");
    if (!nav) return;
    const button = nav.querySelector('button[aria-label="Open menu"]');
    if (!(button instanceof HTMLButtonElement)) return;

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", expanded ? "false" : "true");
      // Minimal: no overlay menu in this static clone; keep state for accessibility.
    });
  }

  function initNavMegaMenus() {
    const nav = document.getElementById("site-nav");
    if (!(nav instanceof HTMLElement)) return;

    const desktopMq = window.matchMedia?.("(min-width: 1024px)") ?? null;
    const isDesktop = () => (desktopMq ? desktopMq.matches : window.innerWidth >= 1024);

    const menus = {
      services: document.querySelector('.nav-mega[data-mega-menu="services"]'),
      cases: document.querySelector('.nav-mega[data-mega-menu="cases"]'),
    };

    const triggers = {
      services: nav.querySelector('a[href="/en/services"]'),
      cases: nav.querySelector('a[href="/en/cases"]'),
    };

    if (!(menus.services instanceof HTMLElement) || !(menus.cases instanceof HTMLElement)) return;
    if (!(triggers.services instanceof HTMLElement) || !(triggers.cases instanceof HTMLElement)) return;

    let openKey = null;
    let closeTimer = 0;

    const setOpen = (key, open) => {
      const el = menus[key];
      if (!(el instanceof HTMLElement)) return;
      el.dataset.open = open ? "true" : "false";
      el.setAttribute("aria-hidden", open ? "false" : "true");
      if (!open && openKey === key) openKey = null;
    };

    const cancelClose = () => {
      if (!closeTimer) return;
      window.clearTimeout(closeTimer);
      closeTimer = 0;
    };

    const closeAll = () => {
      cancelClose();
      setOpen("services", false);
      setOpen("cases", false);
      openKey = null;
    };

    const open = (key) => {
      if (!isDesktop()) return;
      cancelClose();
      if (openKey && openKey !== key) setOpen(openKey, false);
      openKey = key;
      setOpen(key, true);
    };

    const scheduleClose = () => {
      cancelClose();
      closeTimer = window.setTimeout(() => {
        closeAll();
      }, 150);
    };

    const bind = (key) => {
      const trigger = triggers[key];
      const menu = menus[key];
      if (!(trigger instanceof HTMLElement) || !(menu instanceof HTMLElement)) return;

      trigger.addEventListener("mouseenter", () => open(key));
      trigger.addEventListener("focusin", () => open(key));
      trigger.addEventListener("mouseleave", scheduleClose);
      trigger.addEventListener("focusout", scheduleClose);

      menu.addEventListener("mouseenter", cancelClose);
      menu.addEventListener("mouseleave", scheduleClose);
      menu.addEventListener("focusin", cancelClose);
      menu.addEventListener("focusout", scheduleClose);
    };

    bind("cases");
    bind("services");

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closeAll();
    });

    document.addEventListener("pointerdown", (e) => {
      if (!openKey) return;
      const menu = menus[openKey];
      if (!(menu instanceof HTMLElement)) return;
      const target = e.target;
      if (target instanceof Node && (nav.contains(target) || menu.contains(target))) return;
      closeAll();
    }, { passive: true });

    desktopMq?.addEventListener?.("change", () => {
      if (!isDesktop()) closeAll();
    });

    // Services menu: swap preview content on hover/focus.
    const servicePreviews = {
      "/en/service/branding": {
        desc: "We build a brand strategy and identity designed to elevate and grow your brand.",
        alt: "Brand Strategy & Identity",
        src: "https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=3840",
        srcset:
          "https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=640 640w, https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=750 750w, https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=828 828w, https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=1080 1080w, https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=1200 1200w, https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=1920 1920w, https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=2048 2048w, https://images.prismic.io/hatamex/aSceIWGnmrmGqW5h_32.webp?auto=format%2Ccompress&fit=max&w=3840 3840w",
      },
      "/en/service/digital-development": {
        desc: "Custom-built websites and webshops that combine speed, conversion, and scalability.",
        alt: "Digital Development",
        src: "https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=3840",
        srcset:
          "https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=640 640w, https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=750 750w, https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=828 828w, https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=1080 1080w, https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=1200 1200w, https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=1920 1920w, https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=2048 2048w, https://images.prismic.io/hatamex/aScboGGnmrmGqW3G_16.webp?auto=format%2Ccompress&fit=max&w=3840 3840w",
      },
      "/en/service/digital-marketing": {
        desc: "Marketing that expands your reach and delivers more conversions. From campaigns to automation: everything works together",
        alt: "Digital Marketing",
        src: "https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=3840",
        srcset:
          "https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=640 640w, https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=750 750w, https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=828 828w, https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=1080 1080w, https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=1200 1200w, https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=1920 1920w, https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=2048 2048w, https://images.prismic.io/hatamex/aSaw_WGnmrmGqVhc_1-1-.webp?auto=format%2Ccompress&fit=max&w=3840 3840w",
      },
      "/en/service/photography-and-visual-production": {
        desc: "Premium photo, video, and AI-powered visuals that strengthen your brand with standout, attention-grabbing content.",
        alt: "Photography & Visual Production",
        src: "https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=3840",
        srcset:
          "https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=640 640w, https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=750 750w, https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=828 828w, https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=1080 1080w, https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=1200 1200w, https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=1920 1920w, https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=2048 2048w, https://images.prismic.io/hatamex/aSdCgGGnmrmGqXY-_Golden.webp?auto=format%2Ccompress&fit=max&w=3840 3840w",
      },
    };

    const servicesMenu = menus.services;
    const servicesDesc = servicesMenu.querySelector("p.font-body");
    const servicesImg = servicesMenu.querySelector("img[data-remote-src]");
    const serviceLinks = Array.from(servicesMenu.querySelectorAll('a[href^="/en/service/"]'));

    const setPreview = (href) => {
      const cfg = servicePreviews[href];
      if (!cfg) return;
      if (servicesDesc) servicesDesc.textContent = cfg.desc;
      if (servicesImg instanceof HTMLImageElement) {
        // Small transition on swap to match the live feel.
        void animate(
          servicesImg,
          [
            { opacity: 0.9, transform: "scale(1.015)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 350, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
        );

        servicesImg.alt = cfg.alt;
        servicesImg.setAttribute("data-remote-src", cfg.src);
        servicesImg.setAttribute("data-remote-srcset", cfg.srcset);
        if (ASSET_MODE === "remote") {
          servicesImg.src = cfg.src;
          servicesImg.setAttribute("srcset", cfg.srcset);
        } else {
          servicesImg.removeAttribute("srcset");
        }
      }
    };

    for (const link of serviceLinks) {
      if (!(link instanceof HTMLAnchorElement)) continue;
      const href = link.getAttribute("href") || "";
      link.addEventListener("mouseenter", () => setPreview(href));
      link.addEventListener("focus", () => setPreview(href));
    }
  }

  async function main() {
    if (ASSET_MODE === "remote") enableRemoteAssets();

    initNavMotion();
    initMobileNav();
    initNavMegaMenus();

    // Effects that should be ready by the time the preloader clears.
    // (On the live site, the manifesto per-character reveal is driven by Framer Motion and is
    // already active immediately after hydration; delaying it makes the paragraph appear blank.)
    initManifestoReveal();
    initKpiCounters();
    initServicesHover();
    initCasesSlider();

    // Preloader and font readiness happen concurrently; we only need to wait for fonts before
    // doing line-based splitting (which depends on final font metrics).
    const preloaderPromise = runPreloader();
    const fontsPromise = (async () => {
      try {
        await Promise.race([document.fonts.ready, wait(2500)]);
      } catch {}
    })();

    await preloaderPromise;
    await fontsPromise;

    initLineSplitting();
    initScrollReveals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void main();
    });
  } else {
    void main();
  }
})();
