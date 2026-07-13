"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

import {
  BilingualReadingPanel,
  type BilingualProseContent,
  type ReadingLocale,
} from "./bilingual-prose";
import { BilingualText } from "./bilingual-text";

type RelatedArticleItem = {
  slug: string;
  title: BilingualValue;
};

type ExhibitionDetailReadingProps = {
  introLabel: BilingualValue;
  intro: BilingualProseContent;
  description: BilingualProseContent;
  catalogueNoteLabel: BilingualValue;
  catalogueNote: BilingualProseContent;
  curatorialLeadLabel: BilingualValue;
  curatorialLead: BilingualProseContent;
  relatedWritingLabel: BilingualValue;
  relatedArticles: RelatedArticleItem[];
};

export function ExhibitionDetailReading({
  introLabel,
  intro,
  description,
  catalogueNoteLabel,
  catalogueNote,
  curatorialLeadLabel,
  curatorialLead,
  relatedWritingLabel,
  relatedArticles,
}: ExhibitionDetailReadingProps) {
  const [locale, setLocale] = useState<ReadingLocale>("zh");
  const exhibitionTextContent = useMemo<BilingualValue[]>(
    () => [
      ...(Array.isArray(intro) ? intro : [intro]),
      ...(Array.isArray(description) ? description : [description]),
    ],
    [description, intro],
  );
  const exhibitionTextLayoutProps = {
    zhFirstLineIndent: true as const,
    singleLineBreakMode: "soft" as const,
    manualParagraphMode: "split-long" as const,
    manualSplitThresholdZh: 260,
    manualSplitThresholdEn: 420,
  };

  return (
    <section className="mx-auto grid w-full max-w-[var(--content-width)] gap-10 border-t border-[var(--line)] px-[var(--page-inline)] py-14 md:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.72fr)] lg:py-20">
      <section className="max-w-[42rem] scroll-mt-28 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <BilingualText
            as="p"
            text={introLabel}
            mode="inline"
            className="text-[var(--accent-text)]"
            zhClassName="text-xs tracking-[0.12em]"
            enClassName="text-xs uppercase tracking-[0.12em] leading-[1.45]"
          />
          <div className="inline-flex items-center rounded-full border border-[var(--line)]/28 p-1">
            {(["zh", "en"] as const).map((option) => {
              const active = locale === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocale(option)}
                  className={`min-h-11 min-w-11 cursor-pointer select-none rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em] transition-colors ${
                    active
                      ? "bg-[var(--surface)] text-[var(--ink)]"
                      : "text-[var(--accent-text)] hover:text-[var(--ink)]"
                  }`}
                >
                  {option.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        <BilingualReadingPanel
          sections={[
            {
              key: "exhibition-text",
              content: exhibitionTextContent,
              variant: "body",
              expandable: true,
            },
          ]}
          locale={locale}
          onLocaleChange={setLocale}
          showToggle={false}
          {...exhibitionTextLayoutProps}
        />
      </section>

      <div className="border-t border-[var(--line)] pt-5 lg:border-l lg:pl-8 lg:pt-0 lg:border-t-0">
        <BilingualReadingPanel
          className="space-y-6"
          sections={[
            {
              key: "catalogue-intro",
              label: catalogueNoteLabel,
              content: catalogueNote,
              variant: "secondary",
              expandable: true,
            },
            {
              key: "curatorial-lead",
              label: curatorialLeadLabel,
              content: curatorialLead,
              variant: "secondary",
              expandable: true,
            },
          ]}
          locale={locale}
          onLocaleChange={setLocale}
          showToggle={false}
        />

        {relatedArticles.length > 0 ? (
          <div className="mt-6 border-t border-[var(--line)]/72 pt-5">
            <BilingualText
              as="p"
              text={relatedWritingLabel}
              mode="inline"
              className="mb-4 text-[var(--accent-text)]"
              zhClassName="text-xs tracking-[0.12em]"
              enClassName="text-xs uppercase tracking-[0.12em]"
            />
            <div className="space-y-3">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/journal/${article.slug}`}
                  className="block cursor-pointer text-sm leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                >
                  {locale === "en" && article.title.en.trim() ? article.title.en : article.title.zh}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
