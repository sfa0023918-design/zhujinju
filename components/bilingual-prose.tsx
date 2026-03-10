"use client";

import { useMemo, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

export type BilingualProseContent = BilingualValue | BilingualValue[];
export type ReadingLocale = "zh" | "en";

type ProseVariant = "lead" | "body" | "secondary";

type BilingualProseProps = {
  content: BilingualProseContent;
  className?: string;
  mode?: "stacked" | "single";
  locale?: ReadingLocale;
  variant?: ProseVariant;
};

type ReadingSection = {
  key: string;
  label?: BilingualValue;
  content: BilingualProseContent;
  variant?: ProseVariant;
};

type BilingualReadingPanelProps = {
  sections: ReadingSection[];
  className?: string;
  sectionClassName?: string;
  defaultLocale?: ReadingLocale;
  locale?: ReadingLocale;
  onLocaleChange?: (locale: ReadingLocale) => void;
  showToggle?: boolean;
};

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function getLocalizedText(content: BilingualValue | null | undefined, locale: ReadingLocale) {
  if (!content) {
    return "";
  }

  const preferred = locale === "zh" ? content.zh?.trim() : content.en?.trim();
  const fallback = locale === "zh" ? content.en?.trim() : content.zh?.trim();
  return preferred || fallback || "";
}

export function getParagraphsByLocale(content: BilingualProseContent, locale: ReadingLocale) {
  const items = Array.isArray(content) ? content : [content];

  return items.flatMap((item) => {
    return splitParagraphs(getLocalizedText(item, locale));
  });
}

function hasLocaleContent(content: BilingualProseContent, locale: ReadingLocale) {
  const items = Array.isArray(content) ? content : [content];
  return items.some((item) => (locale === "zh" ? item.zh?.trim() : item.en?.trim()));
}

function proseClasses(variant: ProseVariant, locale: ReadingLocale) {
  if (variant === "lead") {
    return locale === "zh"
      ? "prose-block prose-block--zh max-w-[38rem] text-[1.02rem] leading-[2.02] text-[var(--ink)] md:text-[1.06rem]"
      : "prose-block prose-block--en max-w-[33rem] text-[0.92rem] leading-[1.92] tracking-[0.01em] text-[var(--muted)]/88 md:text-[0.96rem]";
  }

  if (variant === "secondary") {
    return locale === "zh"
      ? "prose-block prose-block--zh max-w-[38rem] text-[0.94rem] leading-[1.96] text-[var(--muted)]"
      : "prose-block prose-block--en max-w-[32rem] text-[0.85rem] leading-[1.84] tracking-[0.01em] text-[var(--muted)]/84";
  }

  return locale === "zh"
    ? "prose-block prose-block--zh max-w-[42rem] text-[0.99rem] leading-[2] text-[var(--muted)]"
    : "prose-block prose-block--en max-w-[35rem] text-[0.89rem] leading-[1.88] tracking-[0.01em] text-[var(--muted)]/84";
}

export function BilingualProse({
  content,
  className,
  mode = "stacked",
  locale = "zh",
  variant = "body",
}: BilingualProseProps) {
  const zhParagraphs = useMemo(() => getParagraphsByLocale(content, "zh"), [content]);
  const enParagraphs = useMemo(() => getParagraphsByLocale(content, "en"), [content]);

  if (!zhParagraphs.length && !enParagraphs.length) {
    return null;
  }

  if (mode === "single") {
    const paragraphs = locale === "en" ? enParagraphs : zhParagraphs;

    return (
      <div className={className}>
        <div className="space-y-4 md:space-y-5">
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${locale}-${index}`}
              lang={locale === "en" ? "en" : "zh-CN"}
              className={proseClasses(variant, locale)}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4 md:space-y-5">
        {zhParagraphs.map((paragraph, index) => (
          <p
            key={`zh-${index}`}
            lang="zh-CN"
            className={proseClasses(variant, "zh")}
          >
            {paragraph}
          </p>
        ))}
      </div>
      {enParagraphs.length ? (
        <div className="mt-4 space-y-3.5 md:mt-5 md:space-y-4">
          {enParagraphs.map((paragraph, index) => (
            <p
              key={`en-${index}`}
              lang="en"
              className={proseClasses(variant, "en")}
            >
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BilingualReadingPanel({
  sections,
  className,
  sectionClassName = "space-y-2.5",
  defaultLocale = "zh",
  locale: controlledLocale,
  onLocaleChange,
  showToggle = true,
}: BilingualReadingPanelProps) {
  const hasEnglish = sections.some((section) => hasLocaleContent(section.content, "en"));
  const [uncontrolledLocale, setUncontrolledLocale] = useState<ReadingLocale>(defaultLocale);
  const locale = controlledLocale ?? uncontrolledLocale;
  const setLocale = onLocaleChange ?? setUncontrolledLocale;

  return (
    <div className={className}>
      {hasEnglish && showToggle ? (
        <div className="mb-4 flex justify-end">
          <div className="inline-flex items-center rounded-full border border-[var(--line)]/28 p-1">
            {(["zh", "en"] as const).map((option) => {
              const active = locale === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocale(option)}
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
      ) : null}

      <div className="space-y-7">
        {sections.map((section) => {
          const paragraphs = getParagraphsByLocale(section.content, locale);

          if (!paragraphs.length) {
            return null;
          }

          return (
            <div key={section.key} className={sectionClassName}>
              {section.label ? (
                <BilingualText
                  as="p"
                  text={section.label}
                  mode="inline"
                  className="text-[var(--accent)]"
                  zhClassName="text-[0.58rem] tracking-[0.15em]"
                  enClassName="text-[0.42rem] uppercase tracking-[0.15em] text-[var(--accent)]/46"
                />
              ) : null}
              <div className="space-y-4 md:space-y-5">
                {paragraphs.map((paragraph, index) => (
                  <p
                    key={`${section.key}-${locale}-${index}`}
                    lang={locale === "en" ? "en" : "zh-CN"}
                    className={proseClasses(section.variant ?? "body", locale)}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
