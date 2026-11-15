"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { getReadingPreview, type ReadingParagraphs } from "@/lib/reading-preview";

import { BilingualText } from "./bilingual-text";

export type BilingualProseContent = BilingualValue | BilingualValue[];
export type ReadingLocale = "zh" | "en";

type ProseVariant = "lead" | "body" | "secondary" | "compact";

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
  paragraphClassName?: string;
  defaultLocale?: ReadingLocale;
  locale?: ReadingLocale;
  onLocaleChange?: (locale: ReadingLocale) => void;
  showToggle?: boolean;
  zhFirstLineIndent?: boolean;
  singleLineBreakMode?: "paragraph" | "soft";
  manualParagraphMode?: "preserve" | "split-long";
  manualSplitThresholdZh?: number;
  manualSplitThresholdEn?: number;
  autoSplitLongSingleParagraph?: boolean;
  repairWrappedLines?: boolean;
};

type ParagraphSplitOptions = {
  repairWrappedLines?: boolean;
  manualParagraphMode?: "preserve" | "split-long";
  manualSplitThresholdZh?: number;
  manualSplitThresholdEn?: number;
  autoSplitLongSingleParagraph?: boolean;
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
      : /[^.!?]+[.!?]+(?:["'’”）)\]]+)?|[^.!?]+$/g;
  const joiner = locale === "zh" ? "" : " ";
  const targetLength = locale === "zh" ? 180 : 420;
  const maxLength = locale === "zh" ? 300 : 680;
  const sentences = (text.match(sentenceRegex) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.join("").replace(/\s/g, "") !== text.replace(/\s/g, "")) {
    return [text];
  }

  if (sentences.length <= 1) {
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

// Printed/PDF text often stores each typeset line as a paragraph. Join only
// unfinished prose; retain sentence endings, list items and short headings.
function repairWrappedParagraphs(paragraphs: string[], locale: ReadingLocale) {
  const result: string[] = [];
  const endsParagraph = /[。！？.!?…；;：:~～][”’"'）)\]]*$/;
  const startsListItem = /^(?:[•●▪-]\s|\d+[.、)]\s*|[一二三四五六七八九十]+[、．])/;
  for (const paragraph of paragraphs) {
    const previous = result.at(-1);
    const isHeading = previous && previous.length <= (locale === "zh" ? 18 : 40)
      && !/[，,、。.!?！？；;：:]/.test(previous);
    if (previous && !endsParagraph.test(previous) && !isHeading && !startsListItem.test(paragraph)) {
      result[result.length - 1] = normalizeParagraphText(`${previous} ${paragraph}`, locale);
    } else {
      result.push(paragraph);
    }
  }
  return result;
}

function splitLongManualParagraphs(
  paragraphs: string[],
  locale: ReadingLocale,
  options?: ParagraphSplitOptions,
) {
  if (options?.manualParagraphMode !== "split-long") {
    return paragraphs;
  }

  const threshold = locale === "zh"
    ? options.manualSplitThresholdZh ?? 260
    : options.manualSplitThresholdEn ?? 420;

  return paragraphs.flatMap((paragraph) => {
    if (paragraph.length < threshold) {
      return [paragraph];
    }

    const chunks = splitBySentenceGroups(paragraph, locale);
    const normalizedChunks = chunks.length > 1 ? chunks : [paragraph];

    return normalizedChunks;
  });
}

function splitParagraphs(
  text: string,
  locale: ReadingLocale,
  singleLineBreakMode: "paragraph" | "soft" = "paragraph",
  options?: ParagraphSplitOptions,
) {
  const normalized = normalizeProseWhitespace(text);
  if (!normalized) {
    return [];
  }

  const hasBlankLineParagraphBreak = /\n\s*\n+/.test(normalized);
  const rawParagraphs = hasBlankLineParagraphBreak
    ? normalized.split(/\n\s*\n+/)
    : singleLineBreakMode === "paragraph"
      ? normalized.split(/\n+/)
      : [normalized];

  const normalizedParagraphs = rawParagraphs
    .map((paragraph) => normalizeParagraphText(paragraph, locale))
    .filter(Boolean);

  const manualParagraphs = options?.repairWrappedLines
    ? repairWrappedParagraphs(normalizedParagraphs, locale)
    : normalizedParagraphs;

  if (manualParagraphs.length > 1) {
    return splitLongManualParagraphs(manualParagraphs, locale, options);
  }

  const singleParagraph = manualParagraphs[0] ?? "";
  if (!singleParagraph) {
    return [];
  }

  if (options?.autoSplitLongSingleParagraph === false) {
    return [singleParagraph];
  }

  const autoSplitThreshold = locale === "zh" ? 300 : 680;
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

export function getParagraphsByLocale(
  content: BilingualProseContent,
  locale: ReadingLocale,
  singleLineBreakMode: "paragraph" | "soft" = "paragraph",
  options?: ParagraphSplitOptions,
) {
  const items = Array.isArray(content) ? content : [content];

  const paragraphs = items.flatMap((item) => {
    return splitParagraphs(getLocalizedText(item, locale), locale, singleLineBreakMode, options);
  });

  return paragraphs;
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

  if (variant === "compact") {
    return locale === "zh"
      ? `prose-block prose-block--zh max-w-[44rem] text-[0.86rem] leading-[1.9] text-[var(--muted)] ${alignmentClasses}`
      : `prose-block prose-block--en max-w-[44rem] text-[0.76rem] leading-[1.68] tracking-[0.02em] text-[var(--muted)]/86 ${alignmentClasses}`;
  }

  return locale === "zh"
    ? `prose-block prose-block--zh max-w-[42rem] text-[1rem] leading-[2.08] text-[var(--muted)] ${alignmentClasses}`
    : `prose-block prose-block--en max-w-[42rem] text-[0.9rem] leading-[1.84] text-[var(--muted)]/90 ${alignmentClasses}`;
}

export function ExpandableReadingText({
  paragraphs,
  translations,
  locale: controlledLocale,
  showBoth = false,
  expandable = true,
  variant = "body",
  paragraphClassName,
}: {
  paragraphs?: string[];
  translations?: ReadingParagraphs;
  locale?: ReadingLocale;
  showBoth?: boolean;
  expandable?: boolean;
  variant?: ProseVariant;
  paragraphClassName?: string;
}) {
  const [selectedLocale, setSelectedLocale] = useState<ReadingLocale>("zh");
  const locale = controlledLocale ?? selectedLocale;
  const [expanded, setExpanded] = useState(false);
  const [columns, setColumns] = useState({ zh: 24, en: 56 });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentId = useId();
  const original = useMemo(() => translations ?? {
    zh: locale === "zh" ? paragraphs ?? [] : [],
    en: locale === "en" ? paragraphs ?? [] : [],
  }, [translations, paragraphs, locale]);
  const excerpt = useMemo(() => getReadingPreview(original, columns), [original, columns]);
  const canExpand = expandable && (["zh", "en"] as const).some(value =>
    excerpt[value].join("") !== original[value].join(""));
  const visible = expanded || !canExpand ? original : excerpt;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let active = true;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const measure = () => {
      if (!active || !context || !wrapper.clientWidth) return;
      const width = showBoth && window.innerWidth > 860
        ? (wrapper.clientWidth - 24) / 2 : wrapper.clientWidth;
      const next = { zh: 24, en: 56 };
      for (const value of ["zh", "en"] as const) {
        const paragraph = wrapper.querySelector<HTMLParagraphElement>(`[data-reading-locale="${value}"] p`)
          ?? wrapper.querySelector<HTMLParagraphElement>("p");
        if (!paragraph) continue;
        const style = getComputedStyle(paragraph);
        // Source Han's full-width CJK characters are one em. Measuring an
        // unrelated Chinese sentence here used to fetch large fallback fonts
        // for characters not used anywhere on the current page.
        let average = Number.parseFloat(style.fontSize);
        if (value === "en") {
          // A hidden/absent English column must not borrow the Chinese font.
          const family = style.getPropertyValue("--font-sans").trim() || style.fontFamily;
          context.font = `${style.fontWeight} ${style.fontSize} ${family}`;
          const sample = "The sculpture reveals its form and material through light. ";
          average = context.measureText(sample).width / sample.length;
        }
        const contentWidth = width - (showBoth && window.innerWidth > 860 && value === "en" ? 24 : 0);
        next[value] = Math.max(8, Math.floor(contentWidth / average));
      }
      setColumns(current => current.zh === next.zh && current.en === next.en ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    window.addEventListener("resize", measure);
    void document.fonts.ready.then(measure);
    measure();
    return () => { active = false; observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [showBoth, locale]);

  function toggleExpanded() {
    setExpanded(!expanded);
    if (expanded) {
      requestAnimationFrame(() => {
        wrapperRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
  }

  return (
    <div ref={wrapperRef} className="reading-excerpt" data-expanded={expanded ? "true" : "false"}>
      {showBoth && !controlledLocale ? <div className="reading-excerpt-tabs" aria-label="阅读语言">
        {(["zh", "en"] as const).map(value => <button key={value} type="button" aria-pressed={locale === value} onClick={() => setSelectedLocale(value)}>{value === "zh" ? "中文" : "English"}</button>)}
      </div> : null}
      <div id={contentId} className={showBoth ? "reading-excerpt-columns" : undefined}>
        {(showBoth ? ["zh", "en"] as const : [locale]).map(value => (
          <div key={value} data-reading-locale={value} data-active={locale === value}>
            {visible[value].map((paragraph, index) => (
              <p key={index} lang={value === "en" ? "en" : "zh-CN"}
                className={`${proseClasses(variant, value)} ${paragraphClassName ?? ""}`.trim()}>
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
      {canExpand ? (
        <button type="button" aria-expanded={expanded} aria-controls={contentId}
          onClick={toggleExpanded} className="reading-excerpt-toggle">
          {translations ? <><span>{expanded ? "收起" : "阅读全文"}</span><span lang="en">{expanded ? "Show less" : "Read more"}</span></>
            : locale === "zh" ? (expanded ? "收起" : "阅读全文") : expanded ? "Show less" : "Read more"}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={expanded ? { transform: "rotate(180deg)" } : undefined}>
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
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
  paragraphClassName,
  defaultLocale = "zh",
  locale: controlledLocale,
  onLocaleChange,
  showToggle = true,
  zhFirstLineIndent = false,
  singleLineBreakMode = "paragraph",
  manualParagraphMode = "preserve",
  manualSplitThresholdZh,
  manualSplitThresholdEn,
  autoSplitLongSingleParagraph = true,
  repairWrappedLines = false,
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
                  className={`min-h-11 min-w-11 rounded-full px-3 py-1 text-xs uppercase tracking-[0.12em] transition-colors ${
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
      ) : null}

      <div className="space-y-7">
        {sections.map((section) => {
          const paragraphs = getParagraphsByLocale(section.content, locale, singleLineBreakMode, {
            manualParagraphMode,
            manualSplitThresholdZh,
            manualSplitThresholdEn,
            autoSplitLongSingleParagraph,
            repairWrappedLines,
          });
          const mergedParagraphClassName = [
            zhFirstLineIndent && locale === "zh" ? "indent-[2em]" : "",
            paragraphClassName ?? "",
          ]
            .filter(Boolean)
            .join(" ");

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
                  className="text-[var(--accent-text)]"
                  zhClassName="text-xs tracking-[0.12em]"
                  enClassName="text-xs uppercase tracking-[0.12em]"
                />
              ) : null}
              {section.expandable ? (
                <ExpandableReadingText
                  translations={{
                    zh: getParagraphsByLocale(section.content, "zh", singleLineBreakMode, { manualParagraphMode, manualSplitThresholdZh, manualSplitThresholdEn, autoSplitLongSingleParagraph, repairWrappedLines }),
                    en: getParagraphsByLocale(section.content, "en", singleLineBreakMode, { manualParagraphMode, manualSplitThresholdZh, manualSplitThresholdEn, autoSplitLongSingleParagraph, repairWrappedLines }),
                  }}
                  locale={locale}
                  variant={section.variant ?? "body"}
                  paragraphClassName={mergedParagraphClassName}
                />
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {paragraphs.map((paragraph, index) => (
                    <p
                      key={`${section.key}-${locale}-${index}`}
                      lang={locale === "en" ? "en" : "zh-CN"}
                      className={`${proseClasses(section.variant ?? "body", locale)} ${mergedParagraphClassName}`.trim()}
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
