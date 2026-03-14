import { loadSiteContent } from "@/lib/site-data";
import { getTelHref, getWhatsAppHref } from "@/lib/contact-links";

import { BilingualText } from "./bilingual-text";
import { FooterSocialLinks } from "./footer-social-links";
import type { FooterPlatform } from "./footer-social-icon";

export async function SiteFooter() {
  const { siteConfig } = await loadSiteContent();
  const year = new Date().getFullYear();
  const normalizedPhone = siteConfig.contact.phone.trim();
  const normalizedWhatsapp = siteConfig.contact.whatsapp.trim();
  const phoneHref = getTelHref(normalizedPhone);
  const whatsappValue = normalizedWhatsapp || normalizedPhone;
  const whatsappHref = getWhatsAppHref(whatsappValue);
  const instagramHref = siteConfig.contact.instagram.startsWith("http")
    ? siteConfig.contact.instagram
    : `https://www.instagram.com/${siteConfig.contact.instagram.replace(/^@/, "")}/`;
  const douyinHref = "https://v.douyin.com/YbUx9r1vtZo/";
  const xiaohongshuHref = "https://xhslink.com/m/9oVMiPqVb3P";
  const youtubeHref = "https://youtube.com/channel/UCMF53nCKLqokRaTcF2HdRig?si=YIq1Uo7nXFk-BBIZ";
  const showWhatsApp = Boolean(whatsappHref);
  const footerPlatforms: FooterPlatform[] = [
    { key: "douyin", label: "抖音", href: douyinHref },
    { key: "xiaohongshu", label: "小红书", href: xiaohongshuHref },
    { key: "wechat", label: "微信" },
    { key: "youtube", label: "YouTube", href: youtubeHref },
    { key: "instagram", label: "Instagram", href: instagramHref },
  ];

  return (
    <footer className="border-t border-[var(--line)]/68">
      <div className="mx-auto grid w-full max-w-[1480px] gap-5 px-5 py-4 text-sm text-[var(--muted)] md:grid-cols-2 md:px-8 md:py-5 lg:grid-cols-[0.9fr_0.68fr_0.72fr] lg:px-10 lg:py-6">
        <div className="max-w-[21rem] space-y-1.5">
          <BilingualText
            as="p"
            text={siteConfig.siteName}
            className="flex flex-col gap-1 text-[var(--ink)]"
            zhClassName="text-[0.84rem] tracking-[0.18em]"
            enClassName="text-[0.53rem] uppercase tracking-[0.16em] text-[var(--accent)]/68"
          />
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
          {phoneHref ? (
            <a className="block text-[0.8rem] leading-[1.55]" href={phoneHref}>
              {siteConfig.contact.phone}
            </a>
          ) : (
            <p className="text-[0.8rem] leading-[1.55]">{siteConfig.contact.phone}</p>
          )}
          {showWhatsApp ? (
            <a className="block text-[0.8rem] leading-[1.55]" href={whatsappHref ?? undefined}>
              WhatsApp: {whatsappValue}
            </a>
          ) : null}
          <p className="text-[0.8rem] leading-[1.55]">WeChat: {siteConfig.contact.wechat}</p>
          <p className="text-[0.8rem] leading-[1.55]">Instagram: {siteConfig.contact.instagram}</p>
        </div>
        <div className="space-y-3 md:col-span-2 lg:col-span-1">
          <div className="space-y-1.5">
            <BilingualText
              as="p"
              text={{ zh: "成都竹瑾居艺术空间", en: "Chengdu Zhu Jin Ju Art Space" }}
              className="flex flex-col gap-1 text-[var(--ink)]"
              zhClassName="text-[0.8rem]"
              enClassName="text-[0.48rem] uppercase tracking-[0.12em] text-[var(--accent)]/52"
            />
            <p className="text-[0.8rem] leading-[1.55] text-[var(--muted)]">成都市青羊区草堂东路88号</p>
            <p className="text-[0.8rem] leading-[1.55] text-[var(--muted)]">邮编 610000</p>
          </div>
          <FooterSocialLinks
            platforms={footerPlatforms}
            wechatQrSrc="/contact/wechat-qr.jpg"
            wechatLabel={siteConfig.contact.wechat}
          />
        </div>
      </div>
    </footer>
  );
}
