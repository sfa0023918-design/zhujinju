import { BilingualText } from "@/components/bilingual-text";
import { ContactForm } from "@/components/contact-form";
import { ProtectedImage } from "@/components/protected-image";
import { getTelHref, getWhatsAppHref } from "@/lib/contact-links";
import type {
  OperationalFact,
  PageCopyContent,
  SiteConfigContent,
} from "@/lib/site-data";

import styles from "./institutional-pages.module.css";

type AboutPageContentProps = {
  siteConfig: SiteConfigContent;
  pageCopy: PageCopyContent;
  operationalFacts: OperationalFact[];
};

type ContactPageContentProps = {
  siteConfig: SiteConfigContent;
  pageCopy: PageCopyContent;
  initialArtwork?: string;
};

const aboutSpaceImage = "/uploads/branding/about-space-entrance-web-v2.jpg";

export function AboutPageContent({
  siteConfig,
  pageCopy,
  operationalFacts,
}: AboutPageContentProps) {
  const aboutHero = pageCopy.about.hero;

  return (
    <div className={styles.pageShell}>
      <section className={styles.aboutHero}>
        <div className={styles.aboutHeroCopy}>
          <BilingualText
            as="p"
            text={siteConfig.about.eyebrow}
            mode="inline"
            className={styles.kicker}
            zhClassName={styles.inlineZh}
            enClassName={styles.inlineEn}
          />
          <BilingualText
            as="h1"
            text={siteConfig.about.title}
            className={styles.pageTitle}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <BilingualText
            as="div"
            text={aboutHero.description}
            className={styles.aboutIntroduction}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>

        <figure className={styles.spaceFigure}>
          <ProtectedImage
            src={aboutSpaceImage}
            alt="竹瑾居艺术空间门头"
            width={1024}
            height={1536}
            priority
            quality={86}
            sizes="(min-width: 1024px) 42vw, 100vw"
            wrapperClassName={styles.spaceImageWrapper}
            className={styles.spaceImage}
          />
        </figure>
      </section>

      <section className={styles.philosophySection}>
        <div className={styles.philosophyHeading}>
          <BilingualText
            as="p"
            text={pageCopy.about.position.eyebrow}
            mode="inline"
            className={styles.kicker}
            zhClassName={styles.inlineZh}
            enClassName={styles.inlineEn}
          />
          <BilingualText
            as="h2"
            text={siteConfig.about.subtitle}
            className={styles.sectionTitle}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>

        <div className={styles.philosophyBody}>
          <div className={`${styles.philosophyLanguageColumn} ${styles.zh}`} lang="zh-CN">
            {siteConfig.about.body.map((paragraph, index) =>
              paragraph.zh.trim() ? (
                <p key={`${paragraph.zh}-${index}`} data-emphasis={index === 0 ? "lead" : "body"}>
                  {paragraph.zh}
                </p>
              ) : null,
            )}
          </div>
          <div className={`${styles.philosophyLanguageColumn} ${styles.en}`} lang="en">
            {siteConfig.about.body.map((paragraph, index) =>
              paragraph.en.trim() ? <p key={`${paragraph.en}-${index}`}>{paragraph.en}</p> : null,
            )}
          </div>
        </div>
      </section>

      <section className={styles.factsSection}>
        <div className={styles.factsGrid}>
          {operationalFacts.map((fact) => (
            <article key={fact.title.zh} className={styles.factItem}>
              <BilingualText
                as="h3"
                text={fact.title}
                className={styles.factTitle}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
              <BilingualText
                as="p"
                text={fact.value}
                className={styles.factValue}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
              <BilingualText
                as="p"
                text={fact.description}
                className={styles.factDescription}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ContactPageContent({
  siteConfig,
  pageCopy,
  initialArtwork,
}: ContactPageContentProps) {
  const labels = siteConfig.contactPage.infoLabels;
  const phoneHref = getTelHref(siteConfig.contact.phone);
  const whatsappValue =
    siteConfig.contact.whatsapp.trim() || siteConfig.contact.phone.trim();
  const whatsappHref = getWhatsAppHref(whatsappValue);

  return (
    <div className={styles.pageShell}>
      <section className={styles.contactHero}>
        <div>
          <BilingualText
            as="p"
            text={siteConfig.contactPage.eyebrow}
            mode="inline"
            className={styles.kicker}
            zhClassName={styles.inlineZh}
            enClassName={styles.inlineEn}
          />
          <BilingualText
            as="h1"
            text={siteConfig.contactPage.title}
            className={styles.pageTitle}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>
        <div className={styles.contactHeroText}>
          <BilingualText
            as="div"
            text={siteConfig.contactPage.description}
            className={styles.contactDescription}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <BilingualText
            as="div"
            text={siteConfig.contactPage.aside}
            className={styles.contactAside}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>
      </section>

      <section className={styles.contactBody}>
        <div className={styles.contactRegister}>
          <div className={styles.contactItem}>
            <BilingualText
              as="h2"
              text={labels.email}
              className={styles.contactLabel}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
            <a href={`mailto:${siteConfig.contact.email}`} className={styles.contactValue}>
              {siteConfig.contact.email}
            </a>
          </div>

          <div className={styles.contactItem}>
            <BilingualText
              as="h2"
              text={labels.wechat}
              className={styles.contactLabel}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
            <p className={styles.contactValue}>{siteConfig.contact.wechat}</p>
          </div>

          <div className={styles.contactItem}>
            <BilingualText
              as="h2"
              text={labels.phoneWhatsapp}
              className={styles.contactLabel}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
            {phoneHref ? (
              <a href={phoneHref} className={styles.contactValue}>
                {siteConfig.contact.phone}
              </a>
            ) : (
              <p className={styles.contactValue}>{siteConfig.contact.phone}</p>
            )}
            {whatsappHref ? (
              <a href={whatsappHref} className={styles.contactSecondaryValue}>
                WhatsApp: {whatsappValue}
              </a>
            ) : null}
          </div>

          <div className={styles.contactItem}>
            <BilingualText
              as="div"
              text={siteConfig.contact.address}
              className={styles.contactAddress}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
            <BilingualText
              as="div"
              text={siteConfig.contact.appointmentNote}
              className={styles.contactNote}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
          </div>

          <div className={styles.contactItem}>
            <BilingualText
              as="div"
              text={siteConfig.contact.replyWindow}
              className={styles.contactAddress}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
            <BilingualText
              as="div"
              text={siteConfig.contact.collaborationNote}
              className={styles.contactNote}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
          </div>
        </div>

        <ContactForm
          initialArtwork={initialArtwork}
          copy={pageCopy.siteChrome.contactForm}
        />
      </section>
    </div>
  );
}
