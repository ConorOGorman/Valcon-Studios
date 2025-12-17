// Shim for static hosting of `index.html` (e.g. GitHub Pages) where `public/` is not treated as web root.
// Loads the real runtime script from `public/script.js`.
(() => {
  if (window.__valconShimLoaded) return;
  window.__valconShimLoaded = true;

  const script = document.createElement("script");
  script.src = "public/script.js";
  script.defer = true;
  document.head.appendChild(script);
})();

