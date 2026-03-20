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

function normalizeInlineWhitespace(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
}

function collapseLocaleWhitespace(text: string, locale: ReadingLocale) {
  const collapsed = text.replace(/[ \t]{2,}/g, " ").trim();

  if (locale === "zh") {
    return collapsed
      .replace(/([\u3400-\u9fff])\s+([\u3400-\u9fff])/g, "$1$2")
      .replace(/([\u3400-\u9fff])\s+([，。！？：；、])/g, "$1$2")
      .replace(/([，。！？：；、])\s+([\u3400-\u9fff])/g, "$1$2");
  }

  return collapsed;
}

function splitIntoSentenceParagraphs(text: string, locale: ReadingLocale) {
  const normalized = collapseLocaleWhitespace(
    normalizeInlineWhitespace(text).replace(/\n+/g, locale === "zh" ? "" : " "),
    locale,
  );

  if (!normalized) {
    return [];
  }

  const sentenceRegex =
    locale === "zh"
      ? /[^。！？!?]+[。！？!?]?/g
      : /[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g;

  return (normalized.match(sentenceRegex) ?? [])
    .map((sentence) => collapseLocaleWhitespace(sentence, locale))
    .filter(Boolean);
}

function mergeOversegmentedParagraphs(text: string, locale: ReadingLocale) {
  const normalized = normalizeInlineWhitespace(text);

  if (!normalized) {
    return "";
  }

  if (locale === "zh") {
    return splitIntoSentenceParagraphs(normalized, locale).join("\n\n");
  }

  const rawParagraphs = normalized
    .split(/\n\s*\n+/)
    .map((paragraph) => collapseLocaleWhitespace(paragraph.replace(/\n+/g, " "), locale))
    .filter(Boolean);

  if (rawParagraphs.length < 4) {
    return normalized;
  }

  const averageLength = rawParagraphs.reduce((sum, paragraph) => sum + paragraph.length, 0) / rawParagraphs.length;
  const shouldMerge = averageLength <= (locale === "zh" ? 48 : 90);

  if (!shouldMerge) {
    return normalized;
  }

  const joiner = locale === "zh" ? "" : " ";
  const targetLength = locale === "zh" ? 120 : 220;
  const merged: string[] = [];
  let current = "";

  rawParagraphs.forEach((paragraph) => {
    if (!current) {
      current = paragraph;
      return;
    }

    const next = `${current}${joiner}${paragraph}`;
    if (current.length >= targetLength || next.length > targetLength + (locale === "zh" ? 36 : 70)) {
      merged.push(current);
      current = paragraph;
      return;
    }

    current = next;
  });

  if (current) {
    merged.push(current);
  }

  return merged.join("\n\n");
}

function normalizeExhibitionTextItem(item: BilingualValue): BilingualValue {
  return {
    ...item,
    zh: mergeOversegmentedParagraphs(item.zh ?? "", "zh"),
    en: mergeOversegmentedParagraphs(item.en ?? "", "en"),
  };
}

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
    ].map(normalizeExhibitionTextItem),
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
    <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.72fr)] lg:px-10 lg:py-20">
      <section className="max-w-[42rem] scroll-mt-28 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <BilingualText
            as="p"
            text={introLabel}
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
                  onClick={() => setLocale(option)}
                  className={`min-w-10 cursor-pointer select-none rounded-full px-3 py-1 text-[0.52rem] uppercase tracking-[0.14em] transition-colors ${
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
          sections={[
            {
              key: "exhibition-text",
              content: exhibitionTextContent,
              variant: "compact",
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
