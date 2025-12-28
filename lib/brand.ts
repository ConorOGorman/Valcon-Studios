const BRAND = "Lucid Studio's";
const BRAND_UPPER = "LUCID STUDIO'S";

function replaceBrandText(input: string) {
  return input
    .replaceAll("VALCON DIGITAL AGENCY", BRAND_UPPER)
    .replaceAll("Valcon Digital Agency", BRAND)
    .replaceAll("Hatamex", BRAND)
    .replaceAll("Valcon", BRAND);
}

export function replaceBrandInHtml(html: string) {
  const withTextNodes = html.replace(/>([^<]*)</g, (_match, text: string) => {
    return `>${replaceBrandText(text)}<`;
  });

  return withTextNodes.replace(
    /\b(aria-label|alt|title)="([^"]*)"/g,
    (_match, attr: string, value: string) => `${attr}="${replaceBrandText(value)}"`,
  );
}

