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
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-5 px-5 py-4 md:px-10 md:py-5">
        <Link href="/" className="min-w-fit">
          <span className="flex items-center text-[var(--ink)]">
            {/* The approved logo lockup is a fixed SVG asset; render it directly to preserve exact proportions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zhujinju-header.svg"
              alt={siteConfig.siteName.zh}
              width={980}
              height={180}
              className="block h-auto w-[168px] md:w-[204px] lg:w-[224px]"
            />
          </span>
        </Link>
        <SiteHeaderNav items={navigation} />
      </div>
    </header>
  );
}
