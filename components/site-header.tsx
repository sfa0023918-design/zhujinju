import Link from "next/link";

import { formatExhibitionPeriod } from "@/lib/display-format";
import { bt } from "@/lib/bilingual";
import { getCurrentExhibition, loadSiteContent } from "@/lib/site-data";

import { SiteHeaderNav } from "./site-header-nav";
import { SiteHeaderFrame } from "./site-header-frame";
import styles from "./site-header.module.css";

const navigation = [
  { href: "/", label: bt("首页", "Home") },
  { href: "/collection", label: bt("藏品", "Collection") },
  { href: "/exhibitions", label: bt("展览", "Exhibitions") },
  { href: "/journal", label: bt("文章", "Journal") },
  { href: "/about", label: bt("关于", "About") },
  { href: "/contact", label: bt("联系", "Contact") },
];

export async function SiteHeader() {
  const content = await loadSiteContent();
  const { siteConfig } = content;
  const current = getCurrentExhibition(content);

  return (
    <SiteHeaderFrame>
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
          loading="lazy"
          decoding="async"
          data-protect="true"
          className={`${styles.logo} ${styles.standardLogo}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/zhujinju-header-ink.png"
          alt=""
          width={908}
          height={322}
          draggable="false"
          loading="lazy"
          decoding="async"
          data-protect="true"
          className={`${styles.logo} ${styles.homeLogo}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/zhujinju-header-cream.png"
          alt=""
          width={908}
          height={322}
          draggable="false"
          loading="lazy"
          decoding="async"
          data-protect="true"
          className={`${styles.logo} ${styles.seasonLogo}`}
        />
      </Link>
      <SiteHeaderNav items={navigation} exhibition={current?.slug === "himalayan-art-2026" ? {
        title: current.title,
        facts: bt([formatExhibitionPeriod(current.period).zh, current.venue.zh].filter(Boolean).join(" · "), [formatExhibitionPeriod(current.period).en, current.venue.en].filter(Boolean).join(" · ")),
      } : undefined} />
    </SiteHeaderFrame>
  );
}
