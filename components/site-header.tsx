import Link from "next/link";

import { loadSiteContent } from "@/lib/site-data";

import { SiteHeaderNav } from "./site-header-nav";
import { bt } from "@/lib/bilingual";

const navigation = [
  { href: "/", label: bt("首页", "Home") },
  { href: "/collection", label: bt("藏品", "Collection") },
  { href: "/exhibitions", label: bt("展览与图录", "Exhibitions") },
  { href: "/journal", label: bt("文章", "Journal") },
  { href: "/about", label: bt("关于", "About") },
  { href: "/contact", label: bt("联系", "Contact") },
];

export async function SiteHeader() {
  const { siteConfig } = await loadSiteContent();

  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-5 py-4 md:gap-4 md:px-8 md:py-5 lg:grid lg:grid-cols-[minmax(252px,304px)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:px-10 xl:grid-cols-[minmax(276px,332px)_minmax(0,1fr)] xl:gap-10 2xl:grid-cols-[minmax(292px,356px)_minmax(0,1fr)] 2xl:px-12">
        <Link
          href="/"
          className="min-w-0 flex-1 max-w-[236px] md:max-w-[292px] lg:w-full lg:max-w-[304px] xl:max-w-[332px] 2xl:max-w-[356px]"
        >
          <span className="flex min-w-0 items-center text-[var(--ink)]">
            {/* The approved logo lockup is a fixed SVG asset; render it directly to preserve exact proportions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zhujinju-header.svg"
              alt={siteConfig.siteName.zh}
              width={980}
              height={180}
              className="block h-auto w-full max-w-[236px] md:max-w-[292px] lg:max-w-[304px] xl:max-w-[332px] 2xl:max-w-[356px]"
            />
          </span>
        </Link>
        <SiteHeaderNav items={navigation} />
      </div>
    </header>
  );
}
