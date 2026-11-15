import type { CSSProperties } from "react";
import { COVER_VAJRA_BACKDROP } from "@/lib/artwork-presentation";
import { SiteContentFrame } from "@/components/site-content-frame";
import { Analytics } from "@vercel/analytics/next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./editorial-fonts.css";
import "./contemporary-fonts.css";
import styles from "./site-layout.module.css";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={styles.siteTheme}
      style={{ "--season-color": COVER_VAJRA_BACKDROP } as CSSProperties}
    >
      <link
        rel="preload"
        href="/fonts/zhujinju-song-medium-core.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/InstrumentSerif-Italic.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/InstrumentSans.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <SiteHeader />
      <SiteContentFrame>{children}</SiteContentFrame>
      <SiteFooter />
      <Analytics />
    </div>
  );
}
