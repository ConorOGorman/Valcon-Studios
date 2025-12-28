export function placeholderDataUri(label = "PLACEHOLDER") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0b0b0b"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><rect x="80" y="80" width="1040" height="640" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/><text x="600" y="420" fill="rgba(255,255,255,0.45)" font-family="ui-sans-serif, system-ui" font-size="28" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

