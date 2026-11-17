import Link from "next/link";
import { loadSiteContent } from "@/lib/site-data";
import { getWhatsAppHref } from "@/lib/contact-links";

import { BilingualText } from "./bilingual-text";
import { FooterSocialLinks } from "./footer-social-links";
import type { FooterPlatform } from "./footer-social-icon";
import styles from "./site-footer.module.css";

function DisclosureChevron() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m5 7.5 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export async function SiteFooter() {
  const { siteConfig } = await loadSiteContent();
  const year = new Date().getFullYear();
  const normalizedPhone = siteConfig.contact.phone.trim();
  const normalizedWhatsapp = siteConfig.contact.whatsapp.trim();
  const whatsappValue = normalizedWhatsapp || normalizedPhone;
  const whatsappHref = getWhatsAppHref(whatsappValue);
  const instagramHref = siteConfig.contact.instagram.startsWith("http")
    ? siteConfig.contact.instagram
    : `https://www.instagram.com/${siteConfig.contact.instagram.replace(/^@/, "")}/`;
  const douyinHref = "https://v.douyin.com/YbUx9r1vtZo/";
  const xiaohongshuHref = "https://xhslink.com/m/9oVMiPqVb3P";
  const youtubeHref =
    "https://youtube.com/channel/UCMF53nCKLqokRaTcF2HdRig?si=YIq1Uo7nXFk-BBIZ";
  const showWhatsApp = Boolean(whatsappHref);
  const footerPlatforms: FooterPlatform[] = [
    { key: "douyin", label: "抖音", href: douyinHref },
    { key: "xiaohongshu", label: "小红书", href: xiaohongshuHref },
    { key: "wechat", label: "微信" },
    { key: "youtube", label: "YouTube", href: youtubeHref },
    { key: "instagram", label: "Instagram", href: instagramHref },
  ];

  const address = (
    <div className={styles.addressBlock}>
      <BilingualText
        as="p"
        text={{ zh: "成都竹瑾居艺术空间", en: "Chengdu Zhu Jin Ju Art Space" }}
        className={styles.spaceName}
        zhClassName={styles.headingZh}
        enClassName={styles.spaceNameEn}
      />
      <p className={styles.contactLine}>成都市青羊区草堂东路88号</p>
      <p className={styles.spaceNameEn} lang="en">No. 88 Caotang East Road, Qingyang District, Chengdu, China</p>
      <p className={styles.contactLine}>邮编 / Postal code 610000</p>
    </div>
  );
  const socialLinks = (
    <FooterSocialLinks
      platforms={footerPlatforms}
      wechatQrSrc="/contact/wechat-qr.jpg"
      wechatLabel={siteConfig.contact.wechat}
    />
  );

  const informationLinks = [
    { href: "/collection", label: siteConfig.footer.collectionLink.zh },
    { href: "/exhibitions", label: siteConfig.footer.exhibitionsLink.zh },
    { href: "/journal", label: siteConfig.footer.journalLink.zh },
    { href: "/about", label: siteConfig.about.title.zh },
  ];
  const logo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/zhujinju-header-cream.png"
      alt={`${siteConfig.siteName.zh} ${siteConfig.siteName.en}`}
      width={908}
      height={322}
      loading="lazy"
      decoding="async"
      className={styles.logo}
      draggable="false"
      data-protect="true"
    />
  );
  const copyright = (
    <>
      {siteConfig.footer.copyrightLabel.zh} © {year} {siteConfig.siteName.zh}{" "}
      {siteConfig.siteName.en}
    </>
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.desktopGrid}>
          <div className={styles.brandBlock}>
            {logo}
            <nav aria-label="页脚导航" className={styles.informationBlock}>
              <span className={styles.heading}>
                {siteConfig.footer.informationHeading.zh}{" "}
                {siteConfig.footer.informationHeading.en}
              </span>
              {informationLinks.map((item) => (
                <Link
                  href={item.href}
                  key={item.href}
                  className={styles.contactLine}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className={styles.copyright}>{copyright}</p>
          </div>
          <div className={styles.contactBlock}>
            <span className={styles.heading}>
              {siteConfig.footer.contactHeading.zh}{" "}
              {siteConfig.footer.contactHeading.en}
            </span>
            <a
              className={styles.contactLine}
              href={`mailto:${siteConfig.contact.email}`}
            >
              {siteConfig.contact.email}
            </a>
            {showWhatsApp ? (
              <a
                className={styles.contactLine}
                href={whatsappHref ?? undefined}
              >
                WhatsApp: {whatsappValue}
              </a>
            ) : null}
            <p className={styles.contactLine}>
              WeChat: {siteConfig.contact.wechat}
            </p>
            <p className={styles.contactLine}>
              Instagram: {siteConfig.contact.instagram}
            </p>
          </div>
          <div className={styles.spaceBlock}>
            <span className={styles.heading}>空间 Visit</span>
            {address}
            <div className={styles.desktopSocial}>{socialLinks}</div>
          </div>
        </div>
      </div>
      <div className={styles.mobile}>
        {logo}
        <nav aria-label="页脚导航" className={styles.mobileInformation}>
          {informationLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.primaryContact}>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className={styles.primaryLink}
          >
            {siteConfig.contact.email}
          </a>
        </div>
        <div className={styles.disclosures}>
          <details>
            <summary>
              <span>
                更多联络方式 <small lang="en">More ways to connect</small>
              </span>
              <DisclosureChevron />
            </summary>
            <div className={styles.detailContent}>
              {showWhatsApp ? (
                <a
                  className={styles.detailLine}
                  href={whatsappHref ?? undefined}
                >
                  WhatsApp: {whatsappValue}
                </a>
              ) : null}
              <p className={styles.detailLine}>
                WeChat: {siteConfig.contact.wechat}
              </p>
              <a
                className={styles.detailLine}
                href={instagramHref}
                target="_blank"
                rel="noreferrer"
              >
                Instagram: {siteConfig.contact.instagram}
              </a>
            </div>
          </details>
          <details>
            <summary>
              <span>
                艺术空间与地址 <small lang="en">Visit us</small>
              </span>
              <DisclosureChevron />
            </summary>
            <div className={styles.detailContent}>{address}</div>
          </details>
        </div>
        <div className={styles.mobileSocial}>{socialLinks}</div>
        <p className={styles.mobileCopyright}>{copyright}</p>
      </div>
    </footer>
  );
}
