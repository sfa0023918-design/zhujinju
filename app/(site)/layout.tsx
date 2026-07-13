import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import styles from "./site-layout.module.css";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={styles.siteTheme}>
      <SiteHeader />
      <main className="site-fade-in">{children}</main>
      <SiteFooter />
    </div>
  );
}
