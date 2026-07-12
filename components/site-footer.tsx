import { loadSiteContent } from "@/lib/site-data";
import { getTelHref, getWhatsAppHref } from "@/lib/contact-links";

import { BilingualText } from "./bilingual-text";
import { FooterSocialLinks } from "./footer-social-links";
import type { FooterPlatform } from "./footer-social-icon";
import styles from "./site-footer.module.css";

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
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <BilingualText
            as="p"
            text={siteConfig.siteName}
            className={styles.siteName}
            zhClassName={styles.siteNameZh}
            enClassName={styles.siteNameEn}
          />
          <p className={styles.copyright}>
            {siteConfig.footer.copyrightLabel.zh} © {year} {siteConfig.siteName.zh} {siteConfig.siteName.en}
          </p>
        </div>
        <div className={styles.contactBlock}>
          <BilingualText
            as="p"
            text={siteConfig.footer.contactHeading}
            mode="inline"
            className={styles.heading}
            zhClassName={styles.headingZh}
            enClassName={styles.headingEn}
          />
          <a className={styles.contactLine} href={`mailto:${siteConfig.contact.email}`}>
            {siteConfig.contact.email}
          </a>
          {phoneHref ? (
            <a className={styles.contactLine} href={phoneHref}>
              {siteConfig.contact.phone}
            </a>
          ) : (
            <p className={styles.contactLine}>{siteConfig.contact.phone}</p>
          )}
          {showWhatsApp ? (
            <a className={styles.contactLine} href={whatsappHref ?? undefined}>
              WhatsApp: {whatsappValue}
            </a>
          ) : null}
          <p className={styles.contactLine}>WeChat: {siteConfig.contact.wechat}</p>
          <p className={styles.contactLine}>Instagram: {siteConfig.contact.instagram}</p>
        </div>
        <div className={styles.spaceBlock}>
          <div className={styles.addressBlock}>
            <BilingualText
              as="p"
              text={{ zh: "成都竹瑾居艺术空间", en: "Chengdu Zhu Jin Ju Art Space" }}
              className={styles.spaceName}
              zhClassName={styles.headingZh}
              enClassName={styles.spaceNameEn}
            />
            <p className={styles.contactLine}>成都市青羊区草堂东路88号</p>
            <p className={styles.contactLine}>邮编 610000</p>
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
