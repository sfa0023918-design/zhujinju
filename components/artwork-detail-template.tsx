"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  Article,
  Artwork,
  Exhibition,
  PageCopyContent,
  SiteConfigContent,
} from "@/lib/site-data";
import { getArtworkStatusText } from "@/lib/bilingual";

import { ArtworkCard } from "./artwork-card";
import { ArtworkGallery } from "./artwork-gallery";
import { BilingualProse, BilingualReadingPanel, getLocalizedText, type ReadingLocale } from "./bilingual-prose";
import { BilingualText } from "./bilingual-text";
import { HistoryBackLink } from "./history-back-link";
import { StatusPill } from "./status-pill";

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
  sectionLabelZh: "text-[0.78rem] leading-[1.4] tracking-[0.12em] text-[var(--accent)]/92",
  sectionLabelEn: "text-[0.66rem] uppercase tracking-[0.13em] text-[var(--accent)]/68 leading-[1.45]",
  primaryLine: "text-[0.86rem] leading-7 text-[var(--ink)]",
  secondaryLine: "text-[0.76rem] leading-6 text-[var(--muted)]",
} as const;

const ARTWORK_HERO_TITLE_CLASSES = {
  zh: "font-serif text-[clamp(1.56rem,2.15vw,2.35rem)] leading-[1.04] tracking-[-0.04em] text-[var(--ink)]",
  en: "text-[0.68rem] uppercase tracking-[0.18em] leading-[1.45] text-[var(--accent)]/58",
} as const;

function hasText(value?: { zh?: string; en?: string } | null) {
  if (!value) {
    return false;
  }

  return Boolean(value.zh?.trim() || value.en?.trim());
}

const SPECIAL_VIEWING_NOTE_SLUG = "artwork-1773412663200";
const SPECIAL_VIEWING_NOTE_MARKERS = [
  "观世音菩萨在佛教传统中具有三十三种应化身，世尊观世音即其一。",
  "若从头部开始细看，这尊观音的身份与时代特征都极为明确。",
  "再看面部，这尊观音几乎集中体现了成熟帕拉造像最迷人的开脸方式。",
  "身体部分的处理，同样是帕拉造像成熟时期的重要标志。",
  "菩萨胸前佩戴单层嵌银项链，下方为嵌宝石璎珞，双臂饰菱形臂钏；",
  "观音左手执莲，右手轻垂膝前施予愿印，这一组合意义非常明确：",
  "下方的仰覆式莲座，同样值得反复观看。",
  "如果将这些局部重新收回到整体中，就会发现，",
  "也正因为如此，这尊观音的气质并不单一。",
  "所以，当我们站在这尊世尊观音面前时，",
  "附注：",
  "关于铭文中提及的人名“庞雅波罗洛迦舍（pūṇyapālhalokasa）”，",
  "摘自马美美文章",
  "注释:",
  "1. 此处参照 Kashinath Tamot 所提供的铭文释读结果：",
  "3. 杰拉康弥勒菩萨石像铭文同样采用藏文转写梵文的方式镌刻，",
] as const;

function normalizeSpecialViewingNoteZh(text: string) {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/([\u3400-\u9fff])\s+([\u3400-\u9fff])/g, "$1$2")
    .replace(/([\u3400-\u9fff])\s+([，。！？：；、])/g, "$1$2")
    .replace(/([，。！？：；、])\s+([\u3400-\u9fff])/g, "$1$2")
    .replace(/([\u3400-\u9fff])\s+([A-Za-z0-9])/g, "$1$2")
    .replace(/([A-Za-z0-9])\s+([\u3400-\u9fff])/g, "$1$2")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  if (!normalized) {
    return "";
  }

  let paragraphized = normalized;
  SPECIAL_VIEWING_NOTE_MARKERS.forEach((marker) => {
    paragraphized = paragraphized.replaceAll(marker, `\n\n${marker}`);
  });

  return paragraphized.replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").trim();
}

function getViewingNoteForRender(artwork: Artwork) {
  if (artwork.slug !== SPECIAL_VIEWING_NOTE_SLUG) {
    return artwork.viewingNote;
  }

  const zh = normalizeSpecialViewingNoteZh(artwork.viewingNote?.zh ?? "");
  if (!zh) {
    return artwork.viewingNote;
  }

  return {
    ...artwork.viewingNote,
    zh,
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
          zh: "text-[0.74rem] tracking-[0.12em] text-[var(--accent)]/90",
          en: "text-[0.62rem] uppercase tracking-[0.13em] text-[var(--accent)]/62 leading-[1.45]",
        }
      : {
          zh: INFO_COPY_CLASSES.sectionLabelZh,
          en: INFO_COPY_CLASSES.sectionLabelEn,
        };

  return (
    <section id={id} className="scroll-mt-28 border-t border-[var(--line)]/34 pt-4.5 first:border-t-0 first:pt-0">
      <p
        lang={locale === "en" ? "en" : "zh-CN"}
        className={`text-[var(--accent)] ${locale === "zh" ? titleClasses.zh : titleClasses.en}`}
      >
        {getLocalizedText(label, locale)}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ArtworkFacts({ items }: ArtworkFactsProps) {
  const visibleItems = items.filter((item) => hasText(item.value));

  if (!visibleItems.length) {
    return null;
  }

  return (
    <dl className="space-y-0.5 border-t border-[var(--line)]/34 pt-1">
      {visibleItems.map((item) => (
        <div
          key={item.label.zh}
          className="grid items-start gap-x-3 gap-y-1 border-b border-[var(--line)]/18 py-3.5 last:border-b-0 md:grid-cols-[102px_minmax(0,1fr)] md:gap-x-4 md:gap-y-1.5"
        >
          <dt className="min-w-0 text-[var(--accent)]">
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
          <dd className="min-w-0">
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
    <div className="space-y-3.5 border-t border-[var(--line)]/34 pt-5">
      {isSold ? (
        <div className="inline-flex min-h-[3.15rem] w-full items-center justify-center border border-[var(--line)]/58 px-5 text-[var(--muted)]">
          <BilingualText
            as="span"
            text={getArtworkStatusText(artwork.status)}
            className="flex flex-col items-center text-center"
            zhClassName="text-sm leading-none tracking-[0.01em]"
            enClassName="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--accent)]/72 leading-[1.45]"
          />
        </div>
      ) : (
        <Link
          href={inquiryHref}
          className="inline-flex min-h-[3.15rem] w-full items-center justify-center border border-[var(--line-strong)]/62 px-5 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
        >
          <BilingualText
            as="span"
            text={detailCopy.inquireAction}
            className="flex flex-col items-center text-center"
            zhClassName="text-sm leading-none tracking-[0.01em]"
            enClassName="mt-1 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--accent)]/78 leading-[1.45]"
          />
        </Link>
      )}

      {!isSold && supportItems.length ? (
        <div className="flex flex-wrap gap-2">
          {supportItems.map((item) => (
            <Link
              key={item.zh}
              href={`${inquiryHref}&request=${encodeURIComponent(item.zh || item.en)}`}
              className="inline-flex min-h-8 cursor-pointer select-none items-center rounded-full border border-[var(--line)]/26 px-3 text-[var(--muted)] transition-colors hover:border-[var(--line-strong)]/38 hover:text-[var(--ink)]"
            >
              <BilingualText
                as="span"
                text={item}
                mode="single"
                locale={locale}
                className="leading-none"
                zhClassName="text-[0.72rem]"
                enClassName="text-[0.62rem] uppercase tracking-[0.12em] text-[var(--accent)]/66 leading-[1.45]"
              />
            </Link>
          ))}
        </div>
      ) : null}

      {detailCopy.backAction.zh ? (
        <div className="space-y-2.5 border-t border-[var(--line)]/20 pt-3">
          <HistoryBackLink
            fallbackHref="/collection"
            className="inline-flex items-center text-[0.72rem] leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            <BilingualText
              as="span"
              text={detailCopy.backAction}
              className="flex flex-col items-start text-left"
              zhClassName="text-[0.8rem] leading-none tracking-[0.01em]"
              enClassName="mt-1 text-[0.66rem] uppercase tracking-[0.13em] text-[var(--accent)]/72 leading-[1.45]"
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
  const facts = [
    { label: detailCopy.fieldLabels.period, value: artwork.period },
    { label: detailCopy.fieldLabels.regionOrigin, value: joinBilingual(artwork.region, artwork.origin) },
    { label: detailCopy.fieldLabels.material, value: artwork.material },
    { label: detailCopy.fieldLabels.dimensions, value: artwork.dimensions },
  ];
  const hasLead = hasText(artwork.excerpt);

  return (
    <section id={DETAIL_SECTION_IDS.info} className="mx-auto scroll-mt-28 w-full max-w-[1480px] px-5 py-7 md:px-8 md:py-9 lg:px-10 lg:py-10">
      <div className="mb-5 text-[0.82rem] leading-6 text-[var(--muted)]">
        <Link href="/collection" className="transition-colors hover:text-[var(--ink)]">
          {detailCopy.breadcrumb.zh}
        </Link>
        <span className="px-2 text-[var(--accent)]/34">/</span>
        <span className="text-[var(--ink)]">{artwork.title.zh}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.82fr)] lg:gap-16">
        <ArtworkGallery
          title={`${artwork.title.zh} ${artwork.title.en}`.trim()}
          primaryImage={artwork.image}
          category={artwork.category.zh || artwork.category.en}
          gallery={artwork.gallery}
        />

        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-4 border-t border-[var(--line)]/56 pt-5">
            <div className="flex items-center justify-between gap-4">
              <BilingualText
                as="p"
                text={artwork.category}
                mode="inline"
                className="text-[var(--accent)]"
                zhClassName="text-[0.74rem] tracking-[0.14em] text-[var(--accent)]/94"
                enClassName="text-[0.66rem] uppercase tracking-[0.13em] text-[var(--accent)]/72 leading-[1.45]"
              />
              <StatusPill status={artwork.status} />
            </div>
            <div className="space-y-2">
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
                className="max-w-[28rem] text-[0.84rem] leading-[1.85] text-[var(--muted)]"
              >
                {getLocalizedText(artwork.subtitle, locale)}
              </p>
            ) : null}
            {hasLead ? (
              <BilingualProse
                content={artwork.excerpt}
                variant="compact"
                className="max-w-[30rem]"
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
  const isSpecialViewingNote = artwork.slug === SPECIAL_VIEWING_NOTE_SLUG;
  const hasExcerpt = hasText(artwork.excerpt);
  const viewingNoteForRender = getViewingNoteForRender(artwork);
  const hasViewing = hasText(viewingNoteForRender);
  const hasComparison = hasText(artwork.comparisonNote);

  if (!hasExcerpt && !hasViewing && !hasComparison) {
    return null;
  }

  const sections = [
    hasExcerpt
      ? {
          key: "excerpt",
          content: artwork.excerpt,
          variant: "compact" as const,
          expandable: true,
        }
      : null,
    hasViewing
      ? {
          key: "viewing",
          label: detailCopy.viewingNote,
          content: viewingNoteForRender,
          variant: "compact" as const,
          expandable: true,
        }
      : null,
    hasComparison
      ? {
          key: "comparison",
          label: detailCopy.comparisonNote,
          content: artwork.comparisonNote,
          variant: "compact" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label?: { zh: string; en: string };
    content: { zh: string; en: string };
    variant?: "lead" | "body" | "secondary" | "compact";
  }>;

  return (
    <section id={DETAIL_SECTION_IDS.viewing} className="max-w-[42rem] scroll-mt-28 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <BilingualText
          as="p"
          text={detailCopy.scholarlyNote}
          mode="inline"
          className="text-[var(--accent)]"
          zhClassName="text-[0.74rem] tracking-[0.14em] text-[var(--accent)]/94"
          enClassName="text-[0.66rem] uppercase tracking-[0.13em] text-[var(--accent)]/72 leading-[1.45]"
        />
        <div className="inline-flex items-center rounded-full border border-[var(--line)]/28 p-1">
          {(["zh", "en"] as const).map((option) => {
            const active = locale === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onLocaleChange(option)}
                className={`min-w-10 rounded-full px-3 py-1 text-[0.52rem] uppercase tracking-[0.14em] transition-colors ${
                  active
                    ? "bg-[var(--surface)] text-[var(--ink)]"
                    : "text-[var(--accent)]/52 hover:text-[var(--ink)]"
                }`}
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
        paragraphClassName={
          isSpecialViewingNote ? "max-md:![text-align:left] max-md:![text-align-last:auto]" : undefined
        }
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
    <aside className="space-y-4.5 lg:pl-6">
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
      className="mx-auto w-full max-w-[1480px] px-5 pb-1 md:px-8 lg:px-10"
    >
      <div className="flex flex-wrap gap-2.5 border-t border-[var(--line)]/28 pt-4">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className="inline-flex cursor-pointer select-none items-center rounded-full border border-[var(--line)]/26 px-3 py-1.5 text-[var(--muted)] transition-colors hover:border-[var(--line-strong)]/36 hover:text-[var(--ink)] focus-visible:border-[var(--line-strong)]/42 focus-visible:outline-none"
          >
            <BilingualText
              as="span"
              text={section.label}
              mode="inline"
              className="leading-none"
              zhClassName="text-[0.76rem] tracking-[0.01em]"
              enClassName="text-[0.64rem] uppercase tracking-[0.12em] text-[var(--accent)]/68 leading-[1.45]"
            />
          </button>
        ))}
      </div>
    </nav>
  );
}

export function RelatedWorks({ items, detailCopy }: RelatedWorksProps) {
  const visibleItems = items.slice(0, 3);

  if (!visibleItems.length) {
    return null;
  }

  const gridClassName =
    visibleItems.length === 1
      ? "max-w-[24rem]"
      : visibleItems.length === 2
        ? "grid gap-x-7 gap-y-9 md:grid-cols-2"
        : "grid gap-x-7 gap-y-9 md:grid-cols-2 xl:grid-cols-3";
  const innerClassName = visibleItems.length === 1 ? "max-w-[24rem]" : "";
  const headingClassName = visibleItems.length === 1 ? "max-w-[20rem] space-y-1.5" : "max-w-[34rem] space-y-2";
  const titleClassName =
    visibleItems.length === 1
      ? "font-serif text-[clamp(1.58rem,2.2vw,2.1rem)] leading-[1.06] tracking-[-0.035em] text-[var(--ink)] text-balance"
      : "font-serif text-[clamp(1.9rem,3vw,2.65rem)] leading-[1.02] tracking-[-0.04em] text-[var(--ink)]";

  return (
    <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)]/56 px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
      <div className={innerClassName}>
        <div className={headingClassName}>
          <BilingualText
            as="p"
            text={detailCopy.relatedWorks}
            mode="inline"
            className="text-[var(--accent)]"
            zhClassName="text-[0.66rem] tracking-[0.16em]"
            enClassName="text-[0.46rem] uppercase tracking-[0.16em] text-[var(--accent)]/48"
          />
          <h2 className={titleClassName}>
            {detailCopy.relatedWorksTitle.zh}
          </h2>
        </div>
        <div className={`mt-7 ${gridClassName}`}>
          {visibleItems.map((item, index) => (
            <ArtworkCard key={item.slug} artwork={item} priority={index === 0} variant="compact" />
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
    <>
      <ArtworkHero artwork={artwork} detailCopy={detailCopy} siteConfig={siteConfig} locale={locale} />
      <DetailSectionNav sections={sections} />

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)]/56 px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(260px,0.62fr)] lg:gap-14">
          <ArtworkScholarlyNote artwork={artwork} detailCopy={detailCopy} locale={locale} onLocaleChange={setLocale} />
          <ArtworkReferences
            artwork={artwork}
            detailCopy={detailCopy}
            relatedArticles={relatedArticles}
            relatedExhibitions={relatedExhibitions}
            locale={locale}
          />
        </div>
      </section>

      <RelatedWorks items={relatedWorks} detailCopy={detailCopy} />
    </>
  );
}
