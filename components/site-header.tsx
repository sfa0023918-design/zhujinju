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
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-5 py-3.5 md:gap-4 md:px-8 md:py-4 lg:grid lg:grid-cols-[minmax(212px,266px)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:px-10 xl:grid-cols-[minmax(232px,296px)_minmax(0,1fr)] xl:gap-10 2xl:grid-cols-[minmax(248px,312px)_minmax(0,1fr)] 2xl:px-12">
        <Link
          href="/"
          className="min-w-0 flex-1 max-w-[226px] md:max-w-[266px] lg:w-full lg:max-w-[266px] xl:max-w-[296px] 2xl:max-w-[312px]"
        >
          <span className="flex min-w-0 items-center gap-2.5 text-[var(--ink)] md:gap-2.5 lg:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zhujinju-mark.svg"
              alt={siteConfig.siteName.zh}
              width={240}
              height={240}
              className="h-auto w-[28px] flex-none opacity-90 md:w-[31px] lg:w-[33px] xl:w-[37px] 2xl:w-[39px]"
            />
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate font-serif text-[1.3rem] leading-[1] tracking-[0.075em] md:text-[1.42rem] lg:text-[1.48rem] xl:text-[1.58rem] 2xl:text-[1.64rem]">
                {siteConfig.siteName.zh}
              </span>
              <span className="truncate text-[0.41rem] uppercase leading-[1.24] tracking-[0.155em] text-[var(--accent)]/92 md:text-[0.44rem] lg:text-[0.46rem] xl:text-[0.5rem] 2xl:text-[0.52rem]">
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
