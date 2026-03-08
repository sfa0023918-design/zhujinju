import Link from "next/link";

import { loadSiteContent } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

export async function SiteFooter() {
  const { siteConfig } = await loadSiteContent();
  const year = new Date().getFullYear();
  const normalizedPhone = siteConfig.contact.phone.trim();
  const normalizedWhatsapp = siteConfig.contact.whatsapp.trim();
  const showWhatsApp = normalizedWhatsapp && normalizedWhatsapp !== normalizedPhone;
  const footerLinks = [
    { href: "/collection", label: siteConfig.footer.collectionLink },
    { href: "/exhibitions", label: siteConfig.footer.exhibitionsLink },
    { href: "/journal", label: siteConfig.footer.journalLink },
  ];

  return (
    <footer className="border-t border-[var(--line)]/75">
      <div className="mx-auto grid w-full max-w-[1480px] gap-6 px-5 py-5 text-sm text-[var(--muted)] md:grid-cols-[0.96fr_0.74fr_0.82fr] md:px-10 md:py-7">
        <div className="max-w-[24rem] space-y-2.5">
          <BilingualText
            as="p"
            text={siteConfig.siteName}
            className="flex flex-col gap-1 text-[var(--ink)]"
            zhClassName="text-[0.8rem] tracking-[0.2em]"
            enClassName="text-[0.46rem] uppercase tracking-[0.18em] text-[var(--accent)]/44"
          />
          <BilingualText
            as="p"
            text={siteConfig.footer.intro}
            className="flex flex-col gap-2"
            zhClassName="text-[0.84rem] leading-[1.6]"
            enClassName="text-[0.64rem] leading-[1.5] text-[var(--accent)]/44"
          />
          <p className="text-[0.84rem] leading-[1.6] text-[var(--muted)]/88">{siteConfig.footer.appointment.zh}</p>
          <p className="text-[0.8rem] leading-[1.6] text-[var(--muted)]/82">
            {siteConfig.footer.copyrightLabel.zh} © {year} {siteConfig.siteName.zh} {siteConfig.siteName.en}
          </p>
        </div>
        <div className="space-y-2">
          <BilingualText
            as="p"
            text={siteConfig.footer.contactHeading}
            mode="inline"
            className="text-[var(--ink)]"
            zhClassName="text-[0.84rem]"
            enClassName="text-[0.42rem] uppercase tracking-[0.12em] text-[var(--accent)]/44"
          />
          <a className="block text-[0.84rem] leading-[1.6]" href={`mailto:${siteConfig.contact.email}`}>
            {siteConfig.contact.email}
          </a>
          <p className="text-[0.84rem] leading-[1.6]">{siteConfig.contact.phone}</p>
          {showWhatsApp ? <p className="text-[0.84rem] leading-[1.6]">{siteConfig.contact.whatsapp}</p> : null}
          <p className="text-[0.84rem] leading-[1.6]">WeChat: {siteConfig.contact.wechat}</p>
        </div>
        <div className="space-y-2">
          <BilingualText
            as="p"
            text={siteConfig.footer.informationHeading}
            mode="inline"
            className="text-[var(--ink)]"
            zhClassName="text-[0.84rem]"
            enClassName="text-[0.42rem] uppercase tracking-[0.12em] text-[var(--accent)]/44"
          />
          <div className="space-y-1.5">
            {footerLinks.map((item) => (
              <Link key={item.href} className="block text-[0.84rem] leading-[1.6]" href={item.href}>
                <BilingualText
                  as="span"
                  text={item.label}
                  mode="inline"
                  className="block"
                  zhClassName="block"
                  enClassName="text-[0.4rem] uppercase tracking-[0.12em] text-[var(--accent)]/44"
                />
              </Link>
            ))}
          </div>
          <a className="block text-[0.84rem] leading-[1.6]" href={`mailto:${siteConfig.contact.pdfRequest}`}>
            {siteConfig.footer.pdfRequestLabel.zh}
          </a>
          <p className="text-[0.84rem] leading-[1.6]">{siteConfig.footer.instagramLabel.zh}: {siteConfig.contact.instagram}</p>
          <p className="text-[0.84rem] leading-[1.6]">{siteConfig.footer.wechatLabel.zh}: {siteConfig.contact.wechat}</p>
        </div>
      </div>
    </footer>
  );
}
