import { Suspense } from "react";

import { ExpandableReadingText } from "@/components/bilingual-prose";
import { BilingualText } from "@/components/bilingual-text";
import type { InquiryCatalogItem, InquiryWork } from "@/lib/artwork-inquiry";
import type { BilingualText as BilingualValue } from "@/lib/data/types";
import { ContactForm } from "@/components/contact-form";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";
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
  work?: InquiryWork;
  request?: BilingualValue;
  inquiryWorks?: InquiryCatalogItem[];
};

const aboutSpaceImage = "/uploads/branding/about-space-himalayan-art-20260930.png";

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
            alt="竹瑾居艺术空间与旋梯"
            width={724}
            height={1086}
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
          <ExpandableReadingText showBoth translations={{
            zh: siteConfig.about.body.map(paragraph => paragraph.zh).filter(text => text.trim()),
            en: siteConfig.about.body.map(paragraph => paragraph.en).filter(text => text.trim()),
          }} />
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
  work,
  request,
  inquiryWorks,
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
          <div className={styles.contactActions}>
            <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
            <a href="#inquiry">填写咨询 <span lang="en">Inquiry form</span> ↓</a>
          </div>
        </div>
      </section>

      <section className={styles.contactBody}>
        {inquiryWorks ? (
          <Suspense
            fallback={
              <ContactForm copy={pageCopy.siteChrome.contactForm} />
            }
          >
            <ContactInquiryForm
              inquiryWorks={inquiryWorks}
              copy={pageCopy.siteChrome.contactForm}
            />
          </Suspense>
        ) : (
          <ContactForm
            key={JSON.stringify([work?.slug, initialArtwork, request])}
            work={work}
            request={request}
            initialArtwork={initialArtwork}
            copy={pageCopy.siteChrome.contactForm}
          />
        )}
        <div className={styles.contactRegister}>
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
              text={siteConfig.contact.replyWindow}
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
        </div>
      </section>
    </div>
  );
}
