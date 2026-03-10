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

import { ActionLabel } from "./action-label";
import { ArtworkCard } from "./artwork-card";
import { ArtworkGallery } from "./artwork-gallery";
import { BilingualProse, BilingualReadingPanel, getLocalizedText, type ReadingLocale } from "./bilingual-prose";
import { BilingualText } from "./bilingual-text";
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

function hasText(value?: { zh?: string; en?: string } | null) {
  if (!value) {
    return false;
  }

  return Boolean(value.zh?.trim() || value.en?.trim());
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
  label,
  locale,
  tone = "primary",
  children,
}: {
  label: { zh: string; en: string };
  locale: ReadingLocale;
  tone?: "primary" | "secondary";
  children: React.ReactNode;
}) {
  const titleClasses =
    tone === "secondary"
      ? {
          zh: "text-[0.56rem] tracking-[0.14em]",
          en: "text-[0.4rem] uppercase tracking-[0.14em] text-[var(--accent)]/34",
        }
      : {
          zh: "text-[0.6rem] tracking-[0.15em]",
          en: "text-[0.42rem] uppercase tracking-[0.15em] text-[var(--accent)]/42",
        };

  return (
    <section className="border-t border-[var(--line)]/34 pt-4.5 first:border-t-0 first:pt-0">
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

export function ArtworkFacts({ items, locale }: ArtworkFactsProps) {
  const visibleItems = items.filter((item) => hasText(item.value));

  if (!visibleItems.length) {
    return null;
  }

  return (
    <dl className="space-y-0.5 border-t border-[var(--line)]/34 pt-1">
      {visibleItems.map((item) => (
        <div
          key={item.label.zh}
          className="grid gap-1 border-b border-[var(--line)]/18 py-3.5 last:border-b-0 md:grid-cols-[92px_minmax(0,1fr)] md:gap-3.5"
        >
          <dt className="text-[var(--accent)]">
            <p className="text-[0.96rem] font-medium tracking-[0.04em] text-[var(--accent)]/88 md:text-[0.82rem] md:tracking-[0.08em]">
              {getLocalizedText(item.label, locale)}
            </p>
          </dt>
          <dd className="min-w-0">
            <p
              lang={locale === "en" ? "en" : "zh-CN"}
              className={locale === "zh"
                ? "text-[1.22rem] leading-[1.74] text-[var(--ink)] md:text-[1.1rem]"
                : "text-[0.88rem] font-medium uppercase tracking-[0.05em] text-[var(--ink)]/92 md:text-[0.82rem]"}
            >
              {getLocalizedText(item.value, locale)}
            </p>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ArtworkInquiry({
  artwork,
  detailCopy,
  siteConfig,
  locale,
}: ArtworkInquiryProps) {
  const inquiryHref = `/contact?artwork=${encodeURIComponent(`${artwork.title.zh} / ${artwork.title.en}`)}`;
  const supportItems = artwork.inquirySupport.filter(hasText);
  const contactRows = [
    { label: "Email", value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
    { label: "WeChat", value: siteConfig.contact.wechat },
    { label: "Phone", value: siteConfig.contact.phone },
    {
      label: "Instagram",
      value: siteConfig.contact.instagram,
      href: siteConfig.contact.instagram.startsWith("http")
        ? siteConfig.contact.instagram
        : `https://instagram.com/${siteConfig.contact.instagram.replace(/^@/, "")}`,
    },
  ].filter((item) => item.value.trim());

  return (
    <div className="space-y-3.5 border-t border-[var(--line)]/34 pt-5">
      <Link
        href={inquiryHref}
        className="inline-flex min-h-[3.15rem] w-full items-center justify-center border border-[var(--line-strong)]/62 px-5 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
      >
        <ActionLabel text={detailCopy.inquireAction} />
      </Link>

      {supportItems.length ? (
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
                zhClassName="text-[0.64rem]"
                enClassName="text-[0.38rem] uppercase tracking-[0.14em] text-[var(--accent)]/36"
              />
            </Link>
          ))}
        </div>
      ) : null}

      {(contactRows.length || hasText(siteConfig.contact.appointmentNote) || detailCopy.backAction.zh) ? (
        <div className="space-y-2.5 border-t border-[var(--line)]/20 pt-3">
          {contactRows.length ? (
            <dl className="grid gap-y-2 sm:grid-cols-2 sm:gap-x-6">
              {contactRows.map((item) => (
                <div key={`${artwork.slug}-${item.label}`} className="min-w-0">
                  <dt className="text-[0.42rem] uppercase tracking-[0.16em] text-[var(--accent)]/40">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-[0.76rem] leading-6 text-[var(--ink)]">
                    {item.href ? (
                      <a href={item.href} className="transition-colors hover:text-[var(--accent)]">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {hasText(siteConfig.contact.appointmentNote) ? (
            <p
              lang={locale === "en" ? "en" : "zh-CN"}
              className="max-w-[26rem] text-[0.76rem] leading-7 text-[var(--muted)]"
            >
              {getLocalizedText(siteConfig.contact.appointmentNote, locale)}
            </p>
          ) : null}

          <Link
            href="/collection"
            className="inline-flex items-center text-[0.72rem] leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            <ActionLabel text={detailCopy.backAction} />
          </Link>
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
    <section className="mx-auto w-full max-w-[1480px] px-5 py-7 md:px-8 md:py-9 lg:px-10 lg:py-10">
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
                zhClassName="text-[0.68rem] tracking-[0.16em]"
                enClassName="text-[0.46rem] uppercase tracking-[0.15em] text-[var(--accent)]/48"
              />
              <StatusPill status={artwork.status} />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-[clamp(2.5rem,3.8vw,3.4rem)] leading-[0.98] tracking-[-0.045em] text-[var(--ink)]">
                {artwork.title.zh}
              </h1>
              <p className="text-[0.56rem] uppercase tracking-[0.16em] text-[var(--accent)]/44">
                {artwork.title.en}
              </p>
            </div>
            {hasText(artwork.subtitle) ? (
              <p
                lang={locale === "en" ? "en" : "zh-CN"}
                className="max-w-[28rem] text-[0.9rem] leading-7 text-[var(--muted)]"
              >
                {getLocalizedText(artwork.subtitle, locale)}
              </p>
            ) : null}
            {hasLead ? (
              <BilingualProse
                content={artwork.excerpt}
                variant="lead"
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
  const hasExcerpt = hasText(artwork.excerpt);
  const hasViewing = hasText(artwork.viewingNote);
  const hasComparison = hasText(artwork.comparisonNote);

  if (!hasExcerpt && !hasViewing && !hasComparison) {
    return null;
  }

  const sections = [
    hasExcerpt
      ? {
          key: "excerpt",
          content: artwork.excerpt,
          variant: (!hasViewing && !hasComparison ? "lead" : "body") as "lead" | "body",
          expandable: true,
        }
      : null,
    hasViewing
      ? {
          key: "viewing",
          label: detailCopy.viewingNote,
          content: artwork.viewingNote,
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
    variant?: "lead" | "body" | "secondary";
  }>;

  return (
    <section className="max-w-[42rem] space-y-4">
      <div className="flex items-center justify-between gap-4">
        <BilingualText
          as="p"
          text={detailCopy.scholarlyNote}
          mode="inline"
          className="text-[var(--accent)]"
          zhClassName="text-[0.66rem] tracking-[0.16em]"
          enClassName="text-[0.46rem] uppercase tracking-[0.16em] text-[var(--accent)]/48"
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
      <BilingualReadingPanel sections={sections} locale={locale} onLocaleChange={onLocaleChange} showToggle={false} />
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
        <DetailIndexSection label={detailCopy.provenance} locale={locale}>
          <ul className="space-y-3">
            {artwork.provenance.map((item) => (
              <li key={item.label.zh} className="space-y-0.5">
                <p lang={locale === "en" ? "en" : "zh-CN"} className="text-[0.86rem] leading-7 text-[var(--ink)]">
                  {getLocalizedText(item.label, locale)}
                </p>
                {item.note && hasText(item.note) ? (
                  <p lang={locale === "en" ? "en" : "zh-CN"} className="text-[0.76rem] leading-6 text-[var(--muted)]">
                    {getLocalizedText(item.note, locale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </DetailIndexSection>
      ) : null}

      {hasExhibitions ? (
        <DetailIndexSection label={detailCopy.exhibitions} locale={locale}>
          <ul className="space-y-3">
            {artwork.exhibitions.map((item) => (
              <li key={`${item.title.zh}-${item.year}`} className="space-y-0.5">
                <p lang={locale === "en" ? "en" : "zh-CN"} className="text-[0.86rem] leading-7 text-[var(--ink)]">
                  {getLocalizedText(item.title, locale)}
                </p>
                <p lang={locale === "en" ? "en" : "zh-CN"} className="text-[0.76rem] leading-6 text-[var(--muted)]">
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
        <DetailIndexSection label={detailCopy.publications} locale={locale}>
          <ul className="space-y-3">
            {artwork.publications.map((item) => (
              <li key={`${item.title.zh}-${item.year}`} className="space-y-0.5">
                <p lang={locale === "en" ? "en" : "zh-CN"} className="text-[0.86rem] leading-7 text-[var(--ink)]">
                  {getLocalizedText(item.title, locale)}
                </p>
                <p lang={locale === "en" ? "en" : "zh-CN"} className="text-[0.76rem] leading-6 text-[var(--muted)]">
                  {item.year}
                  {locale === "zh" ? "，" : ", "}
                  {getLocalizedText(item.pages, locale)}
                </p>
                {item.note && hasText(item.note) ? (
                  <p lang={locale === "en" ? "en" : "zh-CN"} className="text-[0.76rem] leading-6 text-[var(--muted)]">
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
        <DetailIndexSection label={detailCopy.relatedArticles} locale={locale} tone="secondary">
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

  return (
    <>
      <ArtworkHero artwork={artwork} detailCopy={detailCopy} siteConfig={siteConfig} locale={locale} />

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
