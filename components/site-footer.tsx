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
    <footer className="border-t border-[var(--line)]/68">
      <div className="mx-auto grid w-full max-w-[1480px] gap-5 px-5 py-4 text-sm text-[var(--muted)] md:grid-cols-2 md:px-8 md:py-5 lg:grid-cols-[0.9fr_0.68fr_0.72fr] lg:px-10 lg:py-6">
        <div className="max-w-[21rem] space-y-2">
          <BilingualText
            as="p"
            text={siteConfig.siteName}
            className="flex flex-col gap-1 text-[var(--ink)]"
            zhClassName="text-[0.76rem] tracking-[0.18em]"
            enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/52"
          />
          <BilingualText
            as="p"
            text={siteConfig.footer.intro}
            className="flex flex-col gap-2"
            zhClassName="text-[0.8rem] leading-[1.58] text-[var(--muted)]/92"
            enClassName="text-[0.64rem] leading-[1.48] text-[var(--accent)]/54"
          />
          <p className="text-[0.78rem] leading-[1.55] text-[var(--muted)]/86">{siteConfig.footer.appointment.zh}</p>
          <p className="text-[0.76rem] leading-[1.55] text-[var(--muted)]/78">
            {siteConfig.footer.copyrightLabel.zh} © {year} {siteConfig.siteName.zh} {siteConfig.siteName.en}
          </p>
        </div>
        <div className="space-y-1.5">
          <BilingualText
            as="p"
            text={siteConfig.footer.contactHeading}
            mode="inline"
            className="text-[var(--ink)]"
            zhClassName="text-[0.8rem]"
            enClassName="text-[0.48rem] uppercase tracking-[0.12em] text-[var(--accent)]/52"
          />
          <a className="block text-[0.8rem] leading-[1.55]" href={`mailto:${siteConfig.contact.email}`}>
            {siteConfig.contact.email}
          </a>
          <p className="text-[0.8rem] leading-[1.55]">{siteConfig.contact.phone}</p>
          {showWhatsApp ? <p className="text-[0.8rem] leading-[1.55]">{siteConfig.contact.whatsapp}</p> : null}
          <p className="text-[0.8rem] leading-[1.55]">WeChat: {siteConfig.contact.wechat}</p>
          <p className="text-[0.8rem] leading-[1.55]">Instagram: {siteConfig.contact.instagram}</p>
        </div>
        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
          <BilingualText
            as="p"
            text={siteConfig.footer.informationHeading}
            mode="inline"
            className="text-[var(--ink)]"
            zhClassName="text-[0.8rem]"
            enClassName="text-[0.48rem] uppercase tracking-[0.12em] text-[var(--accent)]/52"
          />
          <div className="space-y-1">
            {footerLinks.map((item) => (
              <Link key={item.href} className="block text-[0.8rem] leading-[1.55]" href={item.href}>
                <BilingualText
                  as="span"
                  text={item.label}
                  mode="inline"
                  className="block"
                  zhClassName="block"
                  enClassName="text-[0.46rem] uppercase tracking-[0.12em] text-[var(--accent)]/52"
                />
              </Link>
            ))}
          </div>
          <a className="block text-[0.8rem] leading-[1.55]" href={`mailto:${siteConfig.contact.pdfRequest}`}>
            {siteConfig.footer.pdfRequestLabel.zh}
          </a>
        </div>
      </div>
    </footer>
  );
}
