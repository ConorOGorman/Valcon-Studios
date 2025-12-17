export function RawHtml({ html }: { html: string }) {
  // `display: contents` prevents the wrapper from affecting layout/stacking,
  // keeping pixel parity with the extracted DOM.
  return (
    <div
      style={{ display: "contents" }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
