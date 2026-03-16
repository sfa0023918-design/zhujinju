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
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-5 py-3.5 md:gap-4 md:px-8 md:py-4 lg:grid lg:grid-cols-[minmax(264px,348px)_minmax(0,1fr)] lg:items-center lg:gap-5 lg:px-10 xl:grid-cols-[minmax(310px,408px)_minmax(0,1fr)] xl:gap-7 2xl:grid-cols-[minmax(338px,456px)_minmax(0,1fr)] 2xl:px-12">
        <Link
          href="/"
          className="min-w-0 max-w-[296px] flex-1 md:max-w-[364px] lg:w-full lg:max-w-[348px] xl:max-w-[408px] 2xl:max-w-[456px]"
          aria-label={siteConfig.siteName.zh}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/zhujinju-header.svg"
            alt={siteConfig.siteName.zh}
            width={1600}
            height={253}
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
