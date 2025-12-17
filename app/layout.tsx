import type { ReactNode } from "react";
import { Bootstrap } from "../components/Bootstrap";
import { RawHtml } from "../components/RawHtml";
import {
  appOverlayHtml,
  footerHtml,
  navHtml,
  preloaderHtml,
} from "../lib/valcon-partials";

export default function RootLayout({ children }: { children: ReactNode }) {
  const bodyClass =
    "source_code_pro_f572e928-module__Jbvasa__variable plusjakartasans_c4d1b992-module__AWQD7G__variable rinter_9b3e34ce-module__OAx_Kq__variable bg-black";

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Valcon Digital Agency – Clone</title>

        <link
          rel="preload"
          href="/assets/media/PlusJakartaSans_Variable-s.p.f95c7fb9.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/media/Rinter-s.p.01abee16.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/media/c9e42e3eae6237c2-s.p.24d96596.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        <link rel="stylesheet" href="/assets/css/hatamex.css" />
        <link rel="stylesheet" href="/assets/css/keen.css" />
        <link rel="stylesheet" href="/styles/tokens.css" />
        <link rel="stylesheet" href="/styles/app.css" />
      </head>
      <body className={bodyClass} suppressHydrationWarning>
        <RawHtml html={preloaderHtml} />
        <div
          id="app-shell"
          className="opacity-0 blur-xl transition-all duration-500"
          suppressHydrationWarning
        >
          <RawHtml html={appOverlayHtml} />
          <RawHtml html={navHtml} />
          {children}
          <RawHtml html={footerHtml} />
        </div>
        <Bootstrap />
      </body>
    </html>
  );
}
