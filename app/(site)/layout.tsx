import { Suspense, type CSSProperties } from "react";
import { COVER_VAJRA_BACKDROP } from "@/lib/artwork-presentation";
import { SiteContentFrame } from "@/components/site-content-frame";
import { Analytics } from "@vercel/analytics/next";

import { NavigationPreviewProvider } from "@/components/navigation-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteMenuProvider } from "@/components/site-menu-state";
import { SiteHeader } from "@/components/site-header";
import { SiteFontPreloads } from "@/components/site-font-preloads";

import "./reading-critical-fonts.css";
import "./reading-ui-fonts.css";
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
        <NavigationPreviewProvider>
          <SiteMenuProvider>
            <SiteHeader />
            <SiteContentFrame>{children}</SiteContentFrame>
          </SiteMenuProvider>
        </NavigationPreviewProvider>
        <SiteFooter />
        <Analytics />
      </Suspense>
    </div>
  );
}
