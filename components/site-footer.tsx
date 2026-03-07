import Link from "next/link";

import { loadSiteContent } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

export async function SiteFooter() {
  const { siteConfig, pageCopy } = await loadSiteContent();
  const year = new Date().getFullYear();
  const footerLinks = [
    { href: "/collection", label: pageCopy.siteChrome.footer.collectionLink },
    { href: "/exhibitions", label: pageCopy.siteChrome.footer.exhibitionsLink },
    { href: "/journal", label: pageCopy.siteChrome.footer.journalLink },
  ];

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
            text={pageCopy.siteChrome.footer.intro}
            className="flex flex-col gap-3"
            zhClassName="leading-7"
            enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
          />
          <p className="text-sm leading-7 text-[var(--muted)]">{pageCopy.siteChrome.footer.appointment.zh}</p>
          <p className="text-sm leading-7 text-[var(--muted)]">
            {pageCopy.siteChrome.footer.copyrightLabel.zh} © {year} {siteConfig.siteName.zh} {siteConfig.siteName.en}
          </p>
        </div>
        <div className="space-y-3">
          <BilingualText
            as="p"
            text={pageCopy.siteChrome.footer.contactHeading}
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
            text={pageCopy.siteChrome.footer.informationHeading}
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
            {pageCopy.siteChrome.footer.pdfRequestLabel.zh}
          </a>
          <p>{pageCopy.siteChrome.footer.instagramLabel.zh}: {siteConfig.contact.instagram}</p>
          <p>{pageCopy.siteChrome.footer.wechatLabel.zh}: {siteConfig.contact.wechat}</p>
        </div>
      </div>
    </footer>
  );
}
