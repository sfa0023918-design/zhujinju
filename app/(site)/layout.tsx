import { Suspense, type CSSProperties } from "react";
import { COVER_VAJRA_BACKDROP } from "@/lib/artwork-presentation";
import { SiteContentFrame } from "@/components/site-content-frame";
import { Analytics } from "@vercel/analytics/next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteFontPreloads } from "@/components/site-font-preloads";

import "./reading-fonts.css";
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
      {/* Resolve streamed children inside a boundary, not the theme host node. */}
      <Suspense fallback={null}>
        <SiteFontPreloads />
        <SiteHeader />
        <SiteContentFrame>{children}</SiteContentFrame>
        <SiteFooter />
        <Analytics />
      </Suspense>
    </div>
  );
}
