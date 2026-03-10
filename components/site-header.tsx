import Image from "next/image";
import Link from "next/link";

import { bt } from "@/lib/bilingual";
import { loadSiteContent } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";
import { SiteHeaderNav } from "./site-header-nav";

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
          <span className="flex items-center gap-3 text-[var(--ink)]">
            <Image
              src="/zhujinju-mark.svg"
              alt={siteConfig.siteName.zh}
              width={34}
              height={34}
              priority
              className="h-[34px] w-[34px] flex-none"
            />
            <BilingualText
              as="span"
              text={siteConfig.siteName}
              className="flex flex-col gap-1 text-[var(--ink)]"
              zhClassName="text-[0.95rem] tracking-[0.24em]"
              enClassName="text-[0.56rem] uppercase tracking-[0.24em] text-[var(--accent)]/88"
            />
          </span>
        </Link>
        <SiteHeaderNav items={navigation} />
      </div>
    </header>
  );
}
