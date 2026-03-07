import Link from "next/link";

import { bt } from "@/lib/bilingual";
import { loadSiteContent } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

const footerLinks = [
  { href: "/collection", label: bt("藏品浏览", "Browse Collection") },
  { href: "/exhibitions", label: bt("展览与图录", "Exhibitions & Catalogues") },
  { href: "/journal", label: bt("文章与研究", "Journal & Research") },
];

export async function SiteFooter() {
  const { siteConfig } = await loadSiteContent();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-10 text-sm text-[var(--muted)] md:grid-cols-[1.12fr_0.78fr_0.9fr] md:px-10 md:py-14">
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
              "关注喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术，以作品、展览、图录与研究建立长期判断。",
              "Focused on Himalayan art, Tibetan Buddhist art, and related Asian antiquities, with long-term judgement built through objects, exhibitions, catalogues, and research."
            )}
            className="flex flex-col gap-3"
            zhClassName="leading-7"
            enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
          />
          <p className="text-sm leading-7 text-[var(--muted)]">By Appointment in Shanghai</p>
          <p className="text-sm leading-7 text-[var(--muted)]">Copyright © {year} 竹瑾居 Zhu Jin Ju</p>
        </div>
        <div className="space-y-3">
          <BilingualText
            as="p"
            text={bt("联络", "Contact")}
            mode="inline"
            className="text-[var(--ink)]"
            zhClassName="text-sm"
            enClassName="text-[0.5rem] uppercase tracking-[0.14em] text-[var(--accent)]/76"
          />
          <a className="block" href={`mailto:${siteConfig.contact.email}`}>
            {siteConfig.contact.email}
          </a>
          <p>{siteConfig.contact.phone}</p>
          <p>{siteConfig.contact.whatsapp}</p>
          <p>WeChat: {siteConfig.contact.wechat}</p>
        </div>
        <div className="space-y-3">
          <BilingualText
            as="p"
            text={bt("信息与请求", "Information")}
            mode="inline"
            className="text-[var(--ink)]"
            zhClassName="text-sm"
            enClassName="text-[0.5rem] uppercase tracking-[0.14em] text-[var(--accent)]/76"
          />
          {footerLinks.map((item) => (
            <Link key={item.href} className="block" href={item.href}>
              <BilingualText
                as="span"
                text={item.label}
                mode="inline"
                className="block"
                zhClassName="block"
                enClassName="text-[0.48rem] uppercase tracking-[0.14em] text-[var(--accent)]/76"
              />
            </Link>
          ))}
          <a className="block" href={`mailto:${siteConfig.contact.pdfRequest}`}>
            PDF Request
          </a>
          <p>Instagram: {siteConfig.contact.instagram}</p>
          <p>WeChat: {siteConfig.contact.wechat}</p>
        </div>
      </div>
    </footer>
  );
}
