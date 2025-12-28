"use client";

import { useEffect } from "react";

function revealAppShell() {
  const appShell = document.getElementById("app-shell");
  if (appShell) {
    appShell.classList.remove("opacity-0", "blur-xl");
    appShell.classList.add("opacity-100", "blur-0");
  }

  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
}

function hidePreloader() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  preloader.classList.remove("opacity-100");
  preloader.classList.add("opacity-0");
  (preloader as HTMLElement).style.pointerEvents = "none";
  window.setTimeout(() => preloader.remove(), 350);
}

export function Bootstrap() {
  useEffect(() => {
    const existing = document.querySelector(
      'script[data-valcon-bootstrap="true"], script[src$="/script.js"], script[src$="script.js"]',
    );
    if (existing) return;

    const timeoutId = window.setTimeout(() => {
      if (document.getElementById("preloader")) {
        revealAppShell();
        hidePreloader();
      }
    }, 8000);

    const script = document.createElement("script");
    script.src = "/script.js";
    script.async = true;
    script.dataset.valconBootstrap = "true";
    script.addEventListener("load", () => window.clearTimeout(timeoutId));
    script.addEventListener("error", () => {
      window.clearTimeout(timeoutId);
      revealAppShell();
      hidePreloader();
    });

    document.body.appendChild(script);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
