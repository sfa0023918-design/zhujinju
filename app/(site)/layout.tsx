import { Analytics } from "@vercel/analytics/next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./editorial-fonts.css";
import styles from "./site-layout.module.css";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={styles.siteTheme}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <Analytics />
    </div>
  );
}
