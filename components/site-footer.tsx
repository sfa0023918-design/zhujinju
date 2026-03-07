import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-10 text-sm text-[var(--muted)] md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-10 md:py-14">
        <div className="max-w-xl space-y-4">
          <p className="text-[0.92rem] tracking-[0.28em] text-[var(--ink)]">{siteConfig.siteName}</p>
          <p className="leading-7">
            关注喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术，持续整理收藏、展览、图录与研究内容。
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-[var(--ink)]">联络</p>
          <a className="block" href={`mailto:${siteConfig.contact.email}`}>
            {siteConfig.contact.email}
          </a>
          <p>{siteConfig.contact.wechat}</p>
          <p>{siteConfig.contact.phone}</p>
        </div>
        <div className="space-y-3">
          <p className="text-[var(--ink)]">页面</p>
          <Link className="block" href="/collection">
            藏品浏览
          </Link>
          <Link className="block" href="/exhibitions">
            展览与图录
          </Link>
          <Link className="block" href="/journal">
            文章与研究
          </Link>
        </div>
      </div>
    </footer>
  );
}
