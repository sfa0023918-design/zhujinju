"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  Article,
  Artwork,
  Exhibition,
  PageCopyContent,
  SiteConfigContent,
} from "@/lib/site-data";
import { getArtworkStatusText } from "@/lib/bilingual";
import { resolveArtworkPrimaryImage, resolveArtworkPrimaryImageCandidates } from "@/lib/image-url";

import { ArtworkCard } from "./artwork-card";
import styles from "./artwork-detail.module.css";
import { ArtworkGallery } from "./artwork-gallery";
import { BilingualProse, BilingualReadingPanel, getLocalizedText, type ReadingLocale } from "./bilingual-prose";
import { BilingualText } from "./bilingual-text";
import { HistoryBackLink } from "./history-back-link";

type ArtworkDetailCopy = PageCopyContent["artworkDetail"];

type ArtworkDetailTemplateProps = {
  artwork: Artwork;
  detailCopy: ArtworkDetailCopy;
  siteConfig: SiteConfigContent;
  relatedWorks: Artwork[];
  relatedArticles: Article[];
  relatedExhibitions: Exhibition[];
};

type ArtworkFactsProps = {
  locale: ReadingLocale;
  items: Array<{
    label: { zh: string; en: string };
    value: { zh: string; en: string };
  }>;
};

type ArtworkInquiryProps = {
  artwork: Artwork;
  detailCopy: ArtworkDetailCopy;
  siteConfig: SiteConfigContent;
  locale: ReadingLocale;
};

type ArtworkHeroProps = {
  artwork: Artwork;
  detailCopy: ArtworkDetailCopy;
  siteConfig: SiteConfigContent;
  locale: ReadingLocale;
};

type ArtworkScholarlyNoteProps = {
  artwork: Artwork;
  detailCopy: ArtworkDetailCopy;
  locale: ReadingLocale;
  onLocaleChange: (locale: ReadingLocale) => void;
};

type ArtworkReferencesProps = {
  artwork: Artwork;
  detailCopy: ArtworkDetailCopy;
  relatedArticles: Article[];
  relatedExhibitions: Exhibition[];
  locale: ReadingLocale;
};

type RelatedWorksProps = {
  items: Artwork[];
  detailCopy: ArtworkDetailCopy;
};

type DetailSectionLink = {
  id: string;
  label: { zh: string; en: string };
};

const DETAIL_SECTION_IDS = {
  info: "artwork-info",
  viewing: "artwork-viewing",
  provenance: "artwork-provenance",
  exhibitions: "artwork-exhibitions",
  publications: "artwork-publications",
  relatedArticles: "artwork-related-articles",
} as const;

const INFO_COPY_CLASSES = {
  sectionLabelZh: "text-[0.75rem] leading-[1.5] tracking-[0.06em] text-[var(--accent-text)]",
  sectionLabelEn: "text-[0.75rem] uppercase tracking-[0.06em] text-[var(--accent-text)] leading-[1.5]",
  primaryLine: "text-[0.8125rem] leading-[1.65] text-[var(--ink)]",
  secondaryLine: "text-[0.8125rem] leading-[1.65] text-[var(--muted)]",
} as const;

const ARTWORK_HERO_TITLE_CLASSES = {
  zh: "font-serif text-[clamp(2.375rem,7vw,3.5rem)] leading-[1.05] tracking-[-0.035em] text-[var(--ink)] text-balance",
  en: "text-[0.8125rem] uppercase tracking-[0.08em] leading-[1.6] text-[var(--accent-text)]",
} as const;

function hasText(value?: { zh?: string; en?: string } | null) {
  if (!value) {
    return false;
  }

  return Boolean(value.zh?.trim() || value.en?.trim());
}

function normalizeWrappedViewingText(text: string, locale: ReadingLocale) {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized.includes("\n")) {
    return normalized;
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 4) {
    return normalized;
  }

  const sentenceEndPattern = locale === "zh" ? /[。！？!?；;：:]$/ : /[.!?;:]$/;
  const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
  const noSentenceEndCount = lines.filter((line) => !sentenceEndPattern.test(line)).length;
  const shouldUnwrap =
    (avgLineLength <= 42 && noSentenceEndCount / lines.length >= 0.38) ||
    (lines.length >= 10 && avgLineLength <= 58 && noSentenceEndCount >= 3);

  if (!shouldUnwrap) {
    return normalized;
  }

  return lines.join(locale === "zh" ? "" : " ");
}

function getViewingNoteForRender(artwork: Artwork) {
  const normalizedZh = normalizeWrappedViewingText(artwork.viewingNote?.zh ?? "", "zh");
  const normalizedEn = normalizeWrappedViewingText(artwork.viewingNote?.en ?? "", "en");

  if (
    normalizedZh === (artwork.viewingNote?.zh ?? "") &&
    normalizedEn === (artwork.viewingNote?.en ?? "")
  ) {
    return artwork.viewingNote;
  }

  return {
    ...artwork.viewingNote,
    zh: normalizedZh,
    en: normalizedEn,
  };
}

function joinBilingual(primary: { zh: string; en: string }, secondary?: { zh: string; en: string }) {
  if (!secondary || (!secondary.zh.trim() && !secondary.en.trim())) {
    return primary;
  }

  return {
    zh: `${primary.zh} · ${secondary.zh}`,
    en: `${primary.en} · ${secondary.en}`,
  };
}

function DetailIndexSection({
  id,
  label,
  locale,
  tone = "primary",
  children,
}: {
  id?: string;
  label: { zh: string; en: string };
  locale: ReadingLocale;
  tone?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const titleClasses =
    tone === "secondary"
      ? {
          zh: "text-[0.75rem] tracking-[0.12em] text-[var(--accent-text)]",
          en: "text-[0.75rem] uppercase tracking-[0.12em] text-[var(--accent-text)] leading-[1.45]",
        }
      : {
          zh: INFO_COPY_CLASSES.sectionLabelZh,
          en: INFO_COPY_CLASSES.sectionLabelEn,
        };

  return (
    <section id={id} className={styles.referenceSection}>
      <p
        lang={locale === "en" ? "en" : "zh-CN"}
        className={`${styles.referenceLabel} ${locale === "zh" ? titleClasses.zh : titleClasses.en}`}
      >
        {getLocalizedText(label, locale)}
      </p>
      <div className={styles.referenceContent}>{children}</div>
    </section>
  );
}

export function ArtworkFacts({ items }: ArtworkFactsProps) {
  const visibleItems = items.filter((item) => hasText(item.value));

  if (!visibleItems.length) {
    return null;
  }

  return (
    <dl className={styles.facts}>
      {visibleItems.map((item) => (
        <div key={item.label.zh}>
          <dt>
            <p className={INFO_COPY_CLASSES.sectionLabelZh}>
              {item.label.zh}
            </p>
            {item.label.en?.trim() ? (
              <p
                lang="en"
                className={`mt-1 ${INFO_COPY_CLASSES.sectionLabelEn}`}
              >
                {item.label.en}
              </p>
            ) : null}
          </dt>
          <dd>
            <p className={INFO_COPY_CLASSES.primaryLine}>
              {item.value.zh}
            </p>
            {item.value.en?.trim() ? (
              <p
                lang="en"
                className={`mt-1 ${INFO_COPY_CLASSES.secondaryLine}`}
              >
                {item.value.en}
              </p>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ArtworkInquiry({
  artwork,
  detailCopy,
  locale,
}: ArtworkInquiryProps) {
  const inquiryHref = `/contact?artwork=${encodeURIComponent(`${artwork.title.zh} / ${artwork.title.en}`)}`;
  const isSold = artwork.status === "sold";
  const supportItems = artwork.inquirySupport.filter(hasText);

  return (
    <div className={styles.inquiry}>
      {isSold ? (
        <div className={styles.inquiryAction}>
          <BilingualText
            as="span"
            text={getArtworkStatusText(artwork.status)}
            className={styles.bilingualPair}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>
      ) : (
        <Link
          href={inquiryHref}
          className={styles.inquiryAction}
        >
          <BilingualText
            as="span"
            text={detailCopy.inquireAction}
            className={styles.bilingualPair}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </Link>
      )}

      {!isSold && supportItems.length ? (
        <div className={styles.inquirySupport}>
          {supportItems.map((item) => (
            <Link
              key={item.zh}
              href={`${inquiryHref}&request=${encodeURIComponent(item.zh || item.en)}`}
            >
              <BilingualText
                as="span"
                text={item}
                mode="single"
                locale={locale}
                className={styles.bilingualPair}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
            </Link>
          ))}
        </div>
      ) : null}

      {detailCopy.backAction.zh ? (
        <div>
          <HistoryBackLink
            fallbackHref="/collection"
            className={styles.backAction}
          >
            <BilingualText
              as="span"
              text={detailCopy.backAction}
              className={styles.bilingualPair}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
          </HistoryBackLink>
        </div>
      ) : null}
    </div>
  );
}

export function ArtworkHero({
  artwork,
  detailCopy,
  siteConfig,
  locale,
}: ArtworkHeroProps) {
  const primaryImageCandidates = useMemo(() => resolveArtworkPrimaryImageCandidates(artwork), [artwork]);
  const primaryImage = useMemo(() => resolveArtworkPrimaryImage(artwork), [artwork]);
  const facts = [
    { label: detailCopy.fieldLabels.period, value: artwork.period },
    { label: detailCopy.fieldLabels.regionOrigin, value: joinBilingual(artwork.region, artwork.origin) },
    { label: detailCopy.fieldLabels.material, value: artwork.material },
    { label: detailCopy.fieldLabels.dimensions, value: artwork.dimensions },
  ];
  const hasLead = hasText(artwork.excerpt);

  return (
    <section id={DETAIL_SECTION_IDS.info} className={styles.hero}>
      <div className={styles.breadcrumb}>
        <Link href="/collection" className="transition-colors hover:text-[var(--ink)]">
          {detailCopy.breadcrumb.zh}
        </Link>
        <span>/</span>
        <span>{artwork.title.zh}</span>
      </div>

      <div className={styles.heroGrid}>
        <div className={styles.galleryColumn}>
          <ArtworkGallery
            title={`${artwork.title.zh} ${artwork.title.en}`.trim()}
            primaryImage={primaryImage}
            primaryImageCandidates={primaryImageCandidates}
            category={artwork.category.zh || artwork.category.en}
            gallery={artwork.gallery}
          />
        </div>

        <aside className={styles.recordColumn}>
          <div className={styles.recordHeading}>
            <div className={styles.categoryStatus}>
              <BilingualText
                as="p"
                text={artwork.category}
                className={`${styles.bilingualPair} ${styles.category}`}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
              <BilingualText
                as="p"
                text={getArtworkStatusText(artwork.status)}
                className={`${styles.bilingualPair} ${styles.status}`}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
            </div>
            <div className={styles.titleGroup}>
              <h1 className={ARTWORK_HERO_TITLE_CLASSES.zh}>
                {artwork.title.zh}
              </h1>
              <p className={ARTWORK_HERO_TITLE_CLASSES.en}>
                {artwork.title.en}
              </p>
            </div>
            {hasText(artwork.subtitle) ? (
              <p
                lang={locale === "en" ? "en" : "zh-CN"}
                className={styles.subtitle}
              >
                {getLocalizedText(artwork.subtitle, locale)}
              </p>
            ) : null}
            {hasLead ? (
              <BilingualProse
                content={artwork.excerpt}
                variant="compact"
                className={styles.lead}
                mode="single"
                locale={locale}
              />
            ) : null}
          </div>

          <ArtworkFacts items={facts} locale={locale} />
          <ArtworkInquiry artwork={artwork} detailCopy={detailCopy} siteConfig={siteConfig} locale={locale} />
        </aside>
      </div>
    </section>
  );
}

export function ArtworkScholarlyNote({
  artwork,
  detailCopy,
  locale,
  onLocaleChange,
}: ArtworkScholarlyNoteProps) {
  const viewingNoteForRender = getViewingNoteForRender(artwork);
  const hasViewing = hasText(viewingNoteForRender);
  const hasComparison = hasText(artwork.comparisonNote);

  if (!hasViewing && !hasComparison) {
    return null;
  }

  const sections = [
    hasViewing
      ? {
          key: "viewing",
          label: detailCopy.viewingNote,
          content: viewingNoteForRender,
          variant: "body" as const,
          expandable: true,
        }
      : null,
    hasComparison
      ? {
          key: "comparison",
          label: detailCopy.comparisonNote,
          content: artwork.comparisonNote,
          variant: "body" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label?: { zh: string; en: string };
    content: { zh: string; en: string };
    variant?: "lead" | "body" | "secondary" | "compact";
  }>;

  return (
    <section id={DETAIL_SECTION_IDS.viewing} className={styles.scholarlyColumn}>
      <div className={styles.researchHeading}>
        <BilingualText
          as="p"
          text={detailCopy.scholarlyNote}
          className={`${styles.bilingualPair} ${styles.researchLabel}`}
          zhClassName={styles.zh}
          enClassName={styles.en}
        />
        <div className={styles.localeToggle}>
          {(["zh", "en"] as const).map((option) => {
            const active = locale === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => onLocaleChange(option)}
              >
                {option.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
      <BilingualReadingPanel
        sections={sections}
        locale={locale}
        onLocaleChange={onLocaleChange}
        showToggle={false}
        zhFirstLineIndent
        singleLineBreakMode="soft"
        manualParagraphMode="split-long"
        manualSplitThresholdZh={260}
        manualSplitThresholdEn={420}
      />
    </section>
  );
}

export function ArtworkReferences({
  artwork,
  detailCopy,
  relatedArticles,
  relatedExhibitions,
  locale,
}: ArtworkReferencesProps) {
  const hasProvenance = artwork.provenance.length > 0;
  const hasExhibitions = artwork.exhibitions.length > 0;
  const hasPublications = artwork.publications.length > 0;
  const hasRelatedArticles = relatedArticles.length > 0;
  const hasRelatedExhibitions = relatedExhibitions.length > 0;

  if (!hasProvenance && !hasExhibitions && !hasPublications && !hasRelatedArticles && !hasRelatedExhibitions) {
    return null;
  }

  return (
    <aside className={styles.referencesColumn}>
      {hasProvenance ? (
        <DetailIndexSection id={DETAIL_SECTION_IDS.provenance} label={detailCopy.provenance} locale={locale}>
          <ul className="space-y-3">
            {artwork.provenance.map((item) => (
              <li key={item.label.zh} className="space-y-0.5">
                <p lang={locale === "en" ? "en" : "zh-CN"} className={INFO_COPY_CLASSES.primaryLine}>
                  {getLocalizedText(item.label, locale)}
                </p>
                {item.note && hasText(item.note) ? (
                  <p lang={locale === "en" ? "en" : "zh-CN"} className={INFO_COPY_CLASSES.secondaryLine}>
                    {getLocalizedText(item.note, locale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </DetailIndexSection>
      ) : null}

      {hasExhibitions ? (
        <DetailIndexSection id={DETAIL_SECTION_IDS.exhibitions} label={detailCopy.exhibitions} locale={locale}>
          <ul className="space-y-3">
            {artwork.exhibitions.map((item) => (
              <li key={`${item.title.zh}-${item.year}`} className="space-y-0.5">
                <p lang={locale === "en" ? "en" : "zh-CN"} className={INFO_COPY_CLASSES.primaryLine}>
                  {getLocalizedText(item.title, locale)}
                </p>
                <p lang={locale === "en" ? "en" : "zh-CN"} className={INFO_COPY_CLASSES.secondaryLine}>
                  {getLocalizedText(item.venue, locale)}
                  {locale === "zh" ? "，" : ", "}
                  {item.year}
                </p>
              </li>
            ))}
          </ul>
        </DetailIndexSection>
      ) : null}

      {hasPublications ? (
        <DetailIndexSection id={DETAIL_SECTION_IDS.publications} label={detailCopy.publications} locale={locale}>
          <ul className="space-y-3">
            {artwork.publications.map((item) => (
              <li key={`${item.title.zh}-${item.year}`} className="space-y-0.5">
                <p lang={locale === "en" ? "en" : "zh-CN"} className={INFO_COPY_CLASSES.primaryLine}>
                  {getLocalizedText(item.title, locale)}
                </p>
                <p lang={locale === "en" ? "en" : "zh-CN"} className={INFO_COPY_CLASSES.secondaryLine}>
                  {item.year}
                  {locale === "zh" ? "，" : ", "}
                  {getLocalizedText(item.pages, locale)}
                </p>
                {item.note && hasText(item.note) ? (
                  <p lang={locale === "en" ? "en" : "zh-CN"} className={INFO_COPY_CLASSES.secondaryLine}>
                    {getLocalizedText(item.note, locale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </DetailIndexSection>
      ) : null}

      {hasRelatedExhibitions ? (
        <DetailIndexSection label={detailCopy.relatedExhibitions} locale={locale} tone="secondary">
          <div className="space-y-2">
            {relatedExhibitions.map((item) => (
              <Link
                key={item.slug}
                href={`/exhibitions/${item.slug}`}
                className="block text-[0.8rem] leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                {getLocalizedText(item.title, locale)}
              </Link>
            ))}
          </div>
        </DetailIndexSection>
      ) : null}

      {hasRelatedArticles ? (
        <DetailIndexSection
          id={DETAIL_SECTION_IDS.relatedArticles}
          label={detailCopy.relatedArticles}
          locale={locale}
          tone="secondary"
        >
          <div className="space-y-2">
            {relatedArticles.map((item) => (
              <Link
                key={item.slug}
                href={`/journal/${item.slug}`}
                className="block text-[0.8rem] leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                {getLocalizedText(item.title, locale)}
              </Link>
            ))}
          </div>
        </DetailIndexSection>
      ) : null}
    </aside>
  );
}

function DetailSectionNav({ sections }: { sections: DetailSectionLink[] }) {
  if (!sections.length) {
    return null;
  }

  function scrollToSection(id: string) {
    const target = document.getElementById(id);

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Artwork sections"
      className={styles.sectionNav}
    >
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => scrollToSection(section.id)}
        >
          <BilingualText
            as="span"
            text={section.label}
            className={styles.bilingualPair}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </button>
      ))}
    </nav>
  );
}

export function RelatedWorks({ items, detailCopy }: RelatedWorksProps) {
  const visibleItems = items.slice(0, 3);

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section className={styles.relatedWorks}>
      <div>
        <div className={styles.relatedHeading}>
          <BilingualText
            as="p"
            text={detailCopy.relatedWorks}
            className={`${styles.bilingualPair} ${styles.researchLabel}`}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <h2>{detailCopy.relatedWorksTitle.zh}</h2>
        </div>
        <div className={styles.relatedGrid}>
          {visibleItems.map((item, index) => (
            <ArtworkCard key={item.slug} artwork={item} priority={index === 0} variant="catalogue" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ArtworkDetailTemplate({
  artwork,
  detailCopy,
  siteConfig,
  relatedWorks,
  relatedArticles,
  relatedExhibitions,
}: ArtworkDetailTemplateProps) {
  const [locale, setLocale] = useState<ReadingLocale>("zh");
  const sections: DetailSectionLink[] = [
    { id: DETAIL_SECTION_IDS.info, label: { zh: "作品信息", en: "Artwork Info" } },
    (hasText(artwork.excerpt) || hasText(artwork.viewingNote) || hasText(artwork.comparisonNote))
      ? { id: DETAIL_SECTION_IDS.viewing, label: { zh: "观看描述", en: "Visual Description" } }
      : null,
    artwork.provenance.length
      ? { id: DETAIL_SECTION_IDS.provenance, label: detailCopy.provenance }
      : null,
    artwork.exhibitions.length
      ? { id: DETAIL_SECTION_IDS.exhibitions, label: detailCopy.exhibitions }
      : null,
    artwork.publications.length
      ? { id: DETAIL_SECTION_IDS.publications, label: detailCopy.publications }
      : null,
    relatedArticles.length
      ? { id: DETAIL_SECTION_IDS.relatedArticles, label: detailCopy.relatedArticles }
      : null,
  ].filter(Boolean) as DetailSectionLink[];

  return (
    <article className={styles.artworkDetail}>
      <ArtworkHero artwork={artwork} detailCopy={detailCopy} siteConfig={siteConfig} locale={locale} />
      <DetailSectionNav sections={sections} />

      <section className={styles.researchSection}>
        <ArtworkScholarlyNote artwork={artwork} detailCopy={detailCopy} locale={locale} onLocaleChange={setLocale} />
        <ArtworkReferences
          artwork={artwork}
          detailCopy={detailCopy}
          relatedArticles={relatedArticles}
          relatedExhibitions={relatedExhibitions}
          locale={locale}
        />
      </section>

      <RelatedWorks items={relatedWorks} detailCopy={detailCopy} />
    </article>
  );
}
