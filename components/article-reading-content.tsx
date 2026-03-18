"use client";

import { useMemo, useState } from "react";

import type { ArticleContentBlock, BilingualText as BilingualValue } from "@/lib/site-data";
import { withImageVersion } from "@/lib/image-url";

import { getLocalizedText, getParagraphsByLocale, type ReadingLocale } from "./bilingual-prose";
import { ProtectedImage } from "./protected-image";

const ARTICLE_TEXT_MAX_WIDTH_CLASS = "max-w-[52rem]";
const ARTICLE_INLINE_MEDIA_MAX_WIDTH_CLASS = "max-w-[31rem]";
const ARTICLE_FIGURE_CAPTION_CLASS_ZH = "mx-auto max-w-full pt-1 text-center text-[0.77rem] leading-[1.82] text-[var(--accent)]/78 md:text-[0.8rem] md:leading-[1.86]";
const ARTICLE_FIGURE_CAPTION_CLASS_EN =
  "mx-auto max-w-full pt-1 text-center text-[0.66rem] uppercase tracking-[0.1em] leading-[1.64] text-[var(--accent)]/68 md:text-[0.7rem] md:leading-[1.68]";

function proseClasses(variant: "lead" | "body", locale: ReadingLocale) {
  if (variant === "lead") {
    return locale === "zh"
      ? `prose-block prose-block--zh mx-auto ${ARTICLE_TEXT_MAX_WIDTH_CLASS} text-[1.02rem] leading-[1.98] tracking-[0.01em] text-[var(--ink)] md:text-[1.16rem] md:leading-[2.02]`
      : "prose-block prose-block--en mx-auto max-w-[40rem] text-[0.92rem] leading-[1.82] text-[var(--muted)]/92 md:text-[1rem] md:leading-[1.88]";
  }

  return locale === "zh"
    ? `prose-block prose-block--zh mx-auto ${ARTICLE_TEXT_MAX_WIDTH_CLASS} text-[1rem] leading-[2] tracking-[0.01em] text-[var(--ink)] md:text-[1.12rem] md:leading-[2.04]`
    : "prose-block prose-block--en mx-auto max-w-[38rem] text-[0.9rem] leading-[1.8] text-[var(--muted)]/90 md:text-[0.94rem] md:leading-[1.86]";
}

function hasLocalizedContent(content: BilingualValue | undefined, locale: ReadingLocale) {
  return Boolean(locale === "zh" ? content?.zh?.trim() : content?.en?.trim());
}

function isSentenceLikeExcerpt(value: string) {
  return /(?:[。！？.!?]["”’']?|["”’']?[。！？.!?])\s*$/.test(value.trim());
}

function normalizeForDuplicateCompare(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[“”„‟]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/["']/g, "")
    .replace(/[。！？.!?]+$/g, "")
    .replace(/…+/g, "...")
    .toLowerCase();
}

function looksTruncatedExcerpt(value: string) {
  return /(?:\.\.\.|…)\s*$/.test(value.trim());
}

function normalizeForPrefixCompare(value: string) {
  return normalizeForDuplicateCompare(value).replace(/(?:\.\.\.)+$/g, "");
}

function extractLeadingSentence(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.+?(?:[。！？.!?]["”’']?|["”’']?[。！？.!?]))/);
  return match ? match[1] : trimmed;
}

function trimDuplicatedLead(excerptLead: string, firstParagraph: string) {
  const excerptText = excerptLead.trim();
  const firstText = firstParagraph.trim();

  if (!excerptText || !firstText) {
    return firstParagraph;
  }

  const excerptComparable = normalizeForDuplicateCompare(excerptText);
  const firstComparable = normalizeForDuplicateCompare(firstText);
  const leadingSentence = extractLeadingSentence(firstText);
  const leadingComparable = normalizeForDuplicateCompare(leadingSentence);

  // Strong rule: if excerpt and first paragraph are textually the same (ignoring spacing/quotes ending punctuation),
  // always remove the repeated first paragraph.
  if (excerptComparable && excerptComparable === firstComparable) {
    return "";
  }

  if (excerptComparable && excerptComparable === leadingComparable) {
    return firstText.slice(leadingSentence.length).trimStart();
  }

  if (!looksTruncatedExcerpt(excerptText) && firstText.startsWith(excerptText)) {
    return firstText.slice(excerptText.length).trimStart();
  }

  const excerptPrefixComparable = normalizeForPrefixCompare(excerptText);
  if (excerptPrefixComparable && firstComparable.startsWith(excerptPrefixComparable)) {
    // Fallback for punctuation/quote style differences and auto-truncated excerpts.
    return firstText.slice(leadingSentence.length).trimStart();
  }

  if (isSentenceLikeExcerpt(excerptText) && excerptComparable && firstComparable.startsWith(excerptComparable)) {
    return firstText.slice(leadingSentence.length).trimStart();
  }

  return firstParagraph;
}

function articleHasEnglish(excerpt: BilingualValue, blocks: ArticleContentBlock[]) {
  if (excerpt.en?.trim()) {
    return true;
  }

  return blocks.some((block) => {
    if (block.type === "paragraph") {
      return Boolean(block.content.en?.trim());
    }

    if (block.type === "image") {
      return Boolean(block.caption.en?.trim());
    }

    return block.items.some((item) => Boolean(item.caption.en?.trim()));
  });
}

export function ArticleReadingContent({
  excerpt,
  blocks,
  className,
}: {
  excerpt: BilingualValue;
  blocks: ArticleContentBlock[];
  className?: string;
}) {
  const [locale, setLocale] = useState<ReadingLocale>("zh");
  const hasEnglish = useMemo(() => articleHasEnglish(excerpt, blocks), [blocks, excerpt]);
  const excerptParagraphs = useMemo(() => getParagraphsByLocale(excerpt, locale), [excerpt, locale]);
  const excerptLead = excerptParagraphs[0]?.trim() ?? "";
  let checkedFirstBodyParagraph = false;

  return (
    <div className={className}>
      {hasEnglish ? (
        <div className="mx-auto mb-4 flex max-w-[52rem] justify-end md:mb-5 lg:mb-6">
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

      <div className="space-y-8 md:space-y-9 lg:space-y-10">
        {excerptParagraphs.length ? (
          <div className="space-y-4 md:space-y-5">
            {excerptParagraphs.map((paragraph, index) => (
              <p
                key={`excerpt-${locale}-${index}`}
                lang={locale === "en" ? "en" : "zh-CN"}
                className={`${proseClasses("lead", locale)} ${locale === "zh" ? "indent-[2em]" : ""}`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        {blocks.map((block, index) => {
          if (block.type === "paragraph") {
            const paragraphs = getParagraphsByLocale(block.content, locale);

            if (!paragraphs.length) {
              return null;
            }

            let paragraphsForRender = paragraphs;
            if (!checkedFirstBodyParagraph) {
              checkedFirstBodyParagraph = true;
              const [firstParagraph, ...rest] = paragraphs;
              const trimmedFirstParagraph = trimDuplicatedLead(excerptLead, firstParagraph);
              paragraphsForRender = trimmedFirstParagraph ? [trimmedFirstParagraph, ...rest] : rest;
            }

            if (!paragraphsForRender.length) {
              return null;
            }

            return (
              <div key={`paragraph-${index}`} className="space-y-4 md:space-y-5">
                {paragraphsForRender.map((paragraph, paragraphIndex) => (
                  <p
                    key={`paragraph-${index}-${locale}-${paragraphIndex}`}
                    lang={locale === "en" ? "en" : "zh-CN"}
                    className={`${proseClasses("body", locale)} ${locale === "zh" ? "indent-[2em]" : ""}`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            );
          }

          if (block.type === "image") {
            const caption = getLocalizedText(block.caption, locale);
            const figureWidthClass = block.layout === "inline" ? ARTICLE_INLINE_MEDIA_MAX_WIDTH_CLASS : ARTICLE_TEXT_MAX_WIDTH_CLASS;
            const imageClasses =
              block.layout === "inline"
                ? "mx-auto h-auto max-h-[58vh] w-auto max-w-full object-contain md:max-h-[72vh]"
                : "mx-auto h-auto max-h-[58vh] w-full object-contain md:max-h-[72vh]";

            return (
              <figure key={`image-${index}`} className={`mx-auto flex flex-col items-center space-y-3 ${figureWidthClass}`}>
                <ProtectedImage
                  src={withImageVersion(block.image)}
                  alt={caption || `Article reference ${index + 1}`}
                  width={1600}
                  height={1200}
                  unoptimized
                  wrapperClassName={block.layout === "inline" ? "mx-auto w-auto max-w-full" : "block"}
                  className={imageClasses}
                />
                {caption ? (
                  <figcaption
                    lang={locale === "en" ? "en" : "zh-CN"}
                    className={locale === "zh" ? ARTICLE_FIGURE_CAPTION_CLASS_ZH : ARTICLE_FIGURE_CAPTION_CLASS_EN}
                  >
                    {caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          const visibleItems = block.items.filter((item) => item.image.trim());

          if (!visibleItems.length) {
            return null;
          }

          return (
            <div
              key={`image-pair-${index}`}
              className={`mx-auto grid ${ARTICLE_TEXT_MAX_WIDTH_CLASS} gap-4 md:gap-5 ${
                visibleItems.length > 1 ? "md:grid-cols-2" : ""
              }`}
            >
              {visibleItems.map((item, itemIndex) => {
                const caption = getLocalizedText(item.caption, locale);

                return (
                  <figure key={`image-pair-${index}-${itemIndex}`} className="flex flex-col items-center space-y-3">
                    <ProtectedImage
                      src={withImageVersion(item.image)}
                      alt={caption || `Article reference ${index + 1}-${itemIndex + 1}`}
                      width={1200}
                      height={900}
                      unoptimized
                      wrapperClassName="block"
                      className="h-auto w-full bg-[var(--surface-strong)] object-contain"
                    />
                    {caption ? (
                      <figcaption
                        lang={locale === "en" ? "en" : "zh-CN"}
                        className={locale === "zh" ? ARTICLE_FIGURE_CAPTION_CLASS_ZH : ARTICLE_FIGURE_CAPTION_CLASS_EN}
                      >
                        {caption}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
