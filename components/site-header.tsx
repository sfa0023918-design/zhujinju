import Link from "next/link";

import { bt } from "@/lib/bilingual";
import { loadSiteContent } from "@/lib/site-data";

import { SiteHeaderNav } from "./site-header-nav";
import styles from "./site-header.module.css";

const navigation = [
  { href: "/", label: bt("首页", "Home") },
  { href: "/collection", label: bt("藏品", "Collection") },
  { href: "/exhibitions", label: bt("展览与图录", "Exhibitions") },
  { href: "/journal", label: bt("文章与动态", "Journal") },
  { href: "/about", label: bt("关于", "About") },
  { href: "/contact", label: bt("联系", "Contact") },
];

export async function SiteHeader() {
  const { siteConfig } = await loadSiteContent();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          href="/"
          className={styles.brand}
          aria-label={siteConfig.siteName.zh}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/zhujinju-header-v20260317d.png"
            alt={siteConfig.siteName.zh}
            width={908}
            height={322}
            draggable="false"
            data-protect="true"
            className={styles.logo}
          />
        </Link>
        <SiteHeaderNav items={navigation} />
      </div>
    </header>
  );
}
