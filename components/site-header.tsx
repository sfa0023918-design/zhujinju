import Link from "next/link";

import { bt } from "@/lib/bilingual";
import { loadSiteContent } from "@/lib/site-data";

import { SiteHeaderNav } from "./site-header-nav";

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
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-5 py-3.5 md:gap-4 md:px-8 md:py-4 lg:gap-5 lg:px-10 2xl:px-12">
        <Link
          href="/"
          className="w-[clamp(146px,18.2vw,262px)] shrink-0"
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
            className="block h-auto w-full opacity-100"
          />
        </Link>
        <SiteHeaderNav items={navigation} />
      </div>
    </header>
  );
}
