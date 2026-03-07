import Link from "next/link";

import { bt } from "@/lib/bilingual";
import { siteConfig } from "@/lib/site-config";

import { BilingualText } from "./bilingual-text";

const navigation = [
  { href: "/", label: bt("首页", "Home") },
  { href: "/collection", label: bt("藏品", "Collection") },
  { href: "/exhibitions", label: bt("展览与图录", "Exhibitions") },
  { href: "/journal", label: bt("文章", "Journal") },
  { href: "/about", label: bt("关于", "About") },
  { href: "/contact", label: bt("联系", "Contact") },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-8 px-5 py-5 md:px-10 md:py-6">
        <Link href="/" className="min-w-fit">
          <BilingualText
            as="span"
            text={siteConfig.siteName}
            className="flex flex-col gap-1 text-[var(--ink)]"
            zhClassName="text-[0.95rem] tracking-[0.28em]"
            enClassName="text-[0.56rem] uppercase tracking-[0.28em] text-[var(--accent)]"
          />
        </Link>
        <nav
          aria-label="主导航"
          className="flex flex-1 justify-end gap-4 overflow-x-auto text-sm text-[var(--muted)] md:gap-7"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-fit whitespace-nowrap transition-colors duration-300 hover:text-[var(--ink)]"
            >
              <BilingualText
                as="span"
                text={item.label}
                mode="inline"
                className="text-[0.92rem]"
                zhClassName="text-[0.92rem]"
                enClassName="text-[0.46rem] uppercase tracking-[0.14em] text-[var(--accent)]/76"
              />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
