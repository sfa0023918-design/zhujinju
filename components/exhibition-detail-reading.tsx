"use client";

import { useState } from "react";
import Link from "next/link";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualReadingPanel, type BilingualProseContent, type ReadingLocale } from "./bilingual-prose";
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

  return (
    <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-8 py-14 md:px-[3.25rem] md:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.72fr)] lg:px-16 lg:py-20">
      <div className="max-w-[56rem]">
        <div className="mb-5 flex justify-start">
          <div className="inline-flex items-center rounded-full border border-[var(--line)]/26 p-1">
            {(["zh", "en"] as const).map((option) => {
              const active = locale === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocale(option)}
                  className={`min-w-10 cursor-pointer select-none rounded-full px-3 py-1 text-[0.54rem] uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "bg-[var(--surface)] text-[var(--ink)]"
                      : "text-[var(--accent)]/60 hover:text-[var(--ink)]"
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
              key: "intro",
              label: introLabel,
              content: intro,
              variant: "compact",
              expandable: true,
            },
            {
              key: "description",
              content: description,
              variant: "compact",
              expandable: true,
            },
          ]}
          locale={locale}
          onLocaleChange={setLocale}
          showToggle={false}
          paragraphClassName="max-w-[56rem]"
        />
      </div>

      <div className="border-t border-[var(--line)] pt-5 lg:border-l lg:pl-8 lg:pt-0 lg:border-t-0">
        <BilingualReadingPanel
          className="space-y-6"
          sections={[
            {
              key: "catalogue-intro",
              label: catalogueNoteLabel,
              content: catalogueNote,
              variant: "compact",
              expandable: true,
            },
            {
              key: "curatorial-lead",
              label: curatorialLeadLabel,
              content: curatorialLead,
              variant: "compact",
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
              className="mb-4 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.54rem] uppercase tracking-[0.16em] text-[var(--accent)]/78"
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
