import Link from "next/link";

import { bt } from "@/lib/bilingual";
import { siteConfig } from "@/lib/site-config";

import { BilingualText } from "./bilingual-text";

const footerLinks = [
  { href: "/collection", label: bt("藏品浏览", "Browse Collection") },
  { href: "/exhibitions", label: bt("展览与图录", "Exhibitions & Catalogues") },
  { href: "/journal", label: bt("文章与研究", "Journal & Research") },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-10 text-sm text-[var(--muted)] md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-10 md:py-14">
        <div className="max-w-xl space-y-4">
          <BilingualText
            as="p"
            text={siteConfig.siteName}
            className="flex flex-col gap-1 text-[var(--ink)]"
            zhClassName="text-[0.92rem] tracking-[0.28em]"
            enClassName="text-[0.58rem] uppercase tracking-[0.28em] text-[var(--accent)]"
          />
          <BilingualText
            as="p"
            text={bt(
              "关注喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术，持续整理收藏、展览、图录与研究内容。",
              "Focused on Himalayan art, Tibetan Buddhist art, and related Asian antiquities, with ongoing work in collecting, exhibitions, catalogues, and research."
            )}
            className="flex flex-col gap-3"
            zhClassName="leading-7"
            enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
          />
        </div>
        <div className="space-y-3">
          <BilingualText
            as="p"
            text={bt("联络", "Contact")}
            className="flex flex-col gap-1 text-[var(--ink)]"
            zhClassName="text-sm"
            enClassName="text-[0.58rem] uppercase tracking-[0.24em] text-[var(--accent)]"
          />
          <a className="block" href={`mailto:${siteConfig.contact.email}`}>
            {siteConfig.contact.email}
          </a>
          <p>{siteConfig.contact.wechat}</p>
          <p>{siteConfig.contact.phone}</p>
        </div>
        <div className="space-y-3">
          <BilingualText
            as="p"
            text={bt("页面", "Pages")}
            className="flex flex-col gap-1 text-[var(--ink)]"
            zhClassName="text-sm"
            enClassName="text-[0.58rem] uppercase tracking-[0.24em] text-[var(--accent)]"
          />
          {footerLinks.map((item) => (
            <Link key={item.href} className="block" href={item.href}>
              <BilingualText
                as="span"
                text={item.label}
                className="flex flex-col gap-1"
                zhClassName="block"
                enClassName="block text-[0.58rem] uppercase tracking-[0.18em] text-[var(--accent)]"
              />
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
