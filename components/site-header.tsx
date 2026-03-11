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
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-5 py-4 md:gap-4 md:px-8 md:py-5 lg:grid lg:grid-cols-[minmax(232px,294px)_minmax(0,1fr)] lg:items-center lg:gap-7 lg:px-10 xl:grid-cols-[minmax(252px,326px)_minmax(0,1fr)] xl:gap-9 2xl:grid-cols-[minmax(268px,342px)_minmax(0,1fr)] 2xl:px-12">
        <Link
          href="/"
          className="min-w-0 flex-1 max-w-[250px] md:max-w-[294px] lg:w-full lg:max-w-[294px] xl:max-w-[326px] 2xl:max-w-[342px]"
        >
          <span className="flex min-w-0 items-center gap-3 text-[var(--ink)] md:gap-3.5 lg:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zhujinju-mark.svg"
              alt={siteConfig.siteName.zh}
              width={240}
              height={240}
              className="h-auto w-[34px] flex-none md:w-[38px] lg:w-[42px] xl:w-[46px] 2xl:w-[48px]"
            />
            <span className="grid min-w-0 gap-1">
              <span className="truncate font-serif text-[1.38rem] leading-[1] tracking-[0.08em] md:text-[1.52rem] lg:text-[1.6rem] xl:text-[1.72rem] 2xl:text-[1.78rem]">
                {siteConfig.siteName.zh}
              </span>
              <span className="truncate text-[0.48rem] uppercase leading-[1.35] tracking-[0.18em] text-[var(--accent)]/92 md:text-[0.52rem] lg:text-[0.56rem] xl:text-[0.6rem] 2xl:text-[0.62rem]">
                Himalayan Art and Asian Antiquities
              </span>
            </span>
          </span>
        </Link>
        <SiteHeaderNav items={navigation} />
      </div>
    </header>
  );
}
