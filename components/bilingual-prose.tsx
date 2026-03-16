"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  expandable?: boolean;
};

type BilingualReadingPanelProps = {
  sections: ReadingSection[];
  className?: string;
  sectionClassName?: string;
  defaultLocale?: ReadingLocale;
  locale?: ReadingLocale;
  onLocaleChange?: (locale: ReadingLocale) => void;
  showToggle?: boolean;
  zhFirstLineIndent?: boolean;
};

function normalizeProseWhitespace(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
}

function collapseInlineWhitespace(text: string) {
  return text
    .replace(/\s*\n+\s*/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeChineseSpacing(text: string) {
  return text
    .replace(/([\u3400-\u9fff])\s+([\u3400-\u9fff])/g, "$1$2")
    .replace(/([\u3400-\u9fff])\s+([，。！？：；、])/g, "$1$2")
    .replace(/([，。！？：；、])\s+([\u3400-\u9fff])/g, "$1$2");
}

function normalizeParagraphText(text: string, locale: ReadingLocale) {
  const collapsed = collapseInlineWhitespace(text);
  return locale === "zh" ? normalizeChineseSpacing(collapsed) : collapsed;
}

function splitBySentenceGroups(text: string, locale: ReadingLocale) {
  const sentenceRegex =
    locale === "zh"
      ? /[^。！？!?]+[。！？!?]?/g
      : /[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g;
  const joiner = locale === "zh" ? "" : " ";
  const targetLength = locale === "zh" ? 116 : 260;
  const maxLength = locale === "zh" ? 220 : 460;
  const sentences = (text.match(sentenceRegex) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [text];
  }

  const chunks: string[] = [];
  let current = "";

  sentences.forEach((sentence) => {
    if (!current) {
      current = sentence;
      return;
    }

    const next = `${current}${joiner}${sentence}`;
    if (current.length >= targetLength || next.length > maxLength) {
      chunks.push(current);
      current = sentence;
      return;
    }

    current = next;
  });

  if (current) {
    chunks.push(current);
  }

  return chunks.filter(Boolean);
}

function splitParagraphs(text: string, locale: ReadingLocale) {
  const normalized = normalizeProseWhitespace(text);
  if (!normalized) {
    return [];
  }

  const manualParagraphs = normalized
    .split(/\n\s*\n+/)
    .map((paragraph) => normalizeParagraphText(paragraph, locale))
    .filter(Boolean);

  if (manualParagraphs.length > 1) {
    return manualParagraphs;
  }

  const singleParagraph = normalizeParagraphText(normalized, locale);
  if (!singleParagraph) {
    return [];
  }

  const autoSplitThreshold = locale === "zh" ? 220 : 420;
  if (singleParagraph.length < autoSplitThreshold) {
    return [singleParagraph];
  }

  return splitBySentenceGroups(singleParagraph, locale);
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
    return splitParagraphs(getLocalizedText(item, locale), locale);
  });
}

function hasLocaleContent(content: BilingualProseContent, locale: ReadingLocale) {
  const items = Array.isArray(content) ? content : [content];
  return items.some((item) => (locale === "zh" ? item.zh?.trim() : item.en?.trim()));
}

function proseClasses(variant: ProseVariant, locale: ReadingLocale) {
  const alignmentClasses = "break-words [text-align:justify] [text-align-last:left]";

  if (variant === "lead") {
    return locale === "zh"
      ? `prose-block prose-block--zh max-w-[39rem] text-[1.04rem] leading-[2.08] text-[var(--ink)] md:text-[1.08rem] ${alignmentClasses}`
      : `prose-block prose-block--en max-w-[39rem] text-[0.93rem] leading-[1.86] text-[var(--muted)]/92 md:text-[0.97rem] ${alignmentClasses}`;
  }

  if (variant === "secondary") {
    return locale === "zh"
      ? `prose-block prose-block--zh max-w-[38rem] text-[0.95rem] leading-[2.02] text-[var(--muted)] ${alignmentClasses}`
      : `prose-block prose-block--en max-w-[38rem] text-[0.86rem] leading-[1.82] text-[var(--muted)]/88 ${alignmentClasses}`;
  }

  return locale === "zh"
    ? `prose-block prose-block--zh max-w-[42rem] text-[1rem] leading-[2.08] text-[var(--muted)] ${alignmentClasses}`
    : `prose-block prose-block--en max-w-[42rem] text-[0.9rem] leading-[1.84] text-[var(--muted)]/90 ${alignmentClasses}`;
}

function ExpandableReadingText({
  paragraphs,
  locale,
  variant,
  paragraphClassName,
}: {
  paragraphs: string[];
  locale: ReadingLocale;
  variant: ProseVariant;
  paragraphClassName?: string;
}) {
  const [expandedByLocale, setExpandedByLocale] = useState<Record<ReadingLocale, boolean>>({
    zh: false,
    en: false,
  });
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const expanded = expandedByLocale[locale];

  useEffect(() => {
    const element = contentRef.current;
    const inner = innerRef.current;

    if (!element || !inner) {
      return;
    }

    const getCollapsedHeight = () => {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      return isDesktop ? 304 : 208;
    };

    const measure = () => {
      if (!inner) {
        return;
      }
      const nextCanExpand = inner.scrollHeight - getCollapsedHeight() > 8;
      setCanExpand(nextCanExpand);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [locale, paragraphs]);

  function toggleExpanded() {
    const wrapperTop = wrapperRef.current?.getBoundingClientRect().top ?? null;
    const nextExpanded = !expanded;

    setExpandedByLocale((current) => ({
      ...current,
      [locale]: nextExpanded,
    }));

    if (!nextExpanded && wrapperTop !== null) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }
  }

  return (
    <div ref={wrapperRef} className="space-y-3">
      <div
        ref={contentRef}
        data-expanded={expanded ? "true" : "false"}
        className={`relative overflow-hidden transition-[max-height] duration-300 ease-out ${
          !expanded ? "max-h-[13rem] md:max-h-[19rem]" : "max-h-[999rem]"
        }`}
      >
        <div ref={innerRef} className="space-y-4 md:space-y-5">
          {paragraphs.map((paragraph, index) => (
            <p
              key={`${locale}-${index}`}
              lang={locale === "en" ? "en" : "zh-CN"}
              className={`${proseClasses(variant, locale)} ${paragraphClassName ?? ""}`.trim()}
            >
              {paragraph}
            </p>
          ))}
        </div>
        {canExpand && !expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg)] via-[rgba(244,240,232,0.9)] to-transparent" />
        ) : null}
      </div>
      {canExpand ? (
        <button
          type="button"
          onClick={toggleExpanded}
          className="inline-flex cursor-pointer select-none items-center gap-1.5 text-[0.82rem] leading-6 tracking-[0.02em] text-[var(--accent)]/92 transition-colors hover:text-[var(--ink)]"
        >
          {locale === "zh" ? (expanded ? "收起" : "查看更多") : expanded ? "Show less" : "View more"}
          {expanded ? <span aria-hidden="true">∧</span> : null}
        </button>
      ) : null}
    </div>
  );
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
  zhFirstLineIndent = false,
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
          const paragraphClassName = zhFirstLineIndent && locale === "zh" ? "indent-[2em]" : "";

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
              {section.expandable ? (
                <ExpandableReadingText
                  paragraphs={paragraphs}
                  locale={locale}
                  variant={section.variant ?? "body"}
                  paragraphClassName={paragraphClassName}
                />
              ) : (
                <div className="space-y-4 md:space-y-5">
                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={`${section.key}-${locale}-${index}`}
                      lang={locale === "en" ? "en" : "zh-CN"}
                      className={`${proseClasses(section.variant ?? "body", locale)} ${paragraphClassName}`.trim()}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
