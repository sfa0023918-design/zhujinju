"use client";

import { useMemo, useState } from "react";

import type {
  ArticleContentBlock,
  ArticleImageBlock,
  ArticleImagePairItem,
  BilingualText as BilingualValue,
} from "@/lib/site-data";
import { withImageVersion } from "@/lib/image-url";

import { getLocalizedText, getParagraphsByLocale, type ReadingLocale } from "./bilingual-prose";
import { ProtectedImage } from "./protected-image";

const ARTICLE_TEXT_MAX_WIDTH_CLASS = "max-w-[40rem]";
const ARTICLE_LANDSCAPE_MEDIA_MAX_WIDTH_CLASS = "max-w-[52rem]";
const ARTICLE_BALANCED_MEDIA_MAX_WIDTH_CLASS = "max-w-[40rem]";
const ARTICLE_INLINE_MEDIA_MAX_WIDTH_CLASS = "max-w-[31rem]";
const ARTICLE_FIGURE_CAPTION_CLASS_ZH = "mx-auto max-w-full pt-1 text-center text-[0.8125rem] leading-[1.72] text-[var(--muted)]";
const ARTICLE_FIGURE_CAPTION_CLASS_EN =
  "mx-auto max-w-full pt-1 text-center text-[0.8125rem] leading-[1.72] text-[var(--muted)]";

type ArticleMediaAspect = "portrait" | "balanced" | "landscape";

function getArticleMediaAspect(image: HTMLImageElement): ArticleMediaAspect {
  if (!image.naturalWidth || !image.naturalHeight) {
    return "balanced";
  }

  const ratio = image.naturalWidth / image.naturalHeight;

  if (ratio <= 0.88) {
    return "portrait";
  }

  if (ratio >= 1.28) {
    return "landscape";
  }

  return "balanced";
}

function articleMediaWidthClass(layout: ArticleImageBlock["layout"], aspect: ArticleMediaAspect) {
  if (layout === "inline" || aspect === "portrait") {
    return ARTICLE_INLINE_MEDIA_MAX_WIDTH_CLASS;
  }

  return aspect === "landscape"
    ? ARTICLE_LANDSCAPE_MEDIA_MAX_WIDTH_CLASS
    : ARTICLE_BALANCED_MEDIA_MAX_WIDTH_CLASS;
}

function ArticleImageFigure({
  block,
  index,
  locale,
}: {
  block: ArticleImageBlock;
  index: number;
  locale: ReadingLocale;
}) {
  const [aspect, setAspect] = useState<ArticleMediaAspect>("balanced");
  const caption = getLocalizedText(block.caption, locale);

  return (
    <figure
      data-media-aspect={aspect}
      className={`article-reading-media article-reading-media--single mx-auto flex w-full flex-col items-center space-y-3 ${articleMediaWidthClass(
        block.layout,
        aspect,
      )}`}
    >
      <ProtectedImage
        src={withImageVersion(block.image)}
        alt={caption || `Article reference ${index + 1}`}
        width={1600}
        height={1200}
        unoptimized
        wrapperClassName="block w-full"
        className="mx-auto h-auto max-h-[72vh] w-full bg-[var(--surface-strong)] object-contain"
        onLoad={(event) => setAspect(getArticleMediaAspect(event.currentTarget))}
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

function ArticleImagePairFigure({
  item,
  index,
  itemIndex,
  locale,
}: {
  item: ArticleImagePairItem;
  index: number;
  itemIndex: number;
  locale: ReadingLocale;
}) {
  const [aspect, setAspect] = useState<ArticleMediaAspect>("balanced");
  const caption = getLocalizedText(item.caption, locale);

  return (
    <figure
      data-media-aspect={aspect}
      className="flex min-w-0 flex-col items-center justify-start space-y-3"
    >
      <ProtectedImage
        src={withImageVersion(item.image)}
        alt={caption || `Article reference ${index + 1}-${itemIndex + 1}`}
        width={1200}
        height={900}
        unoptimized
        wrapperClassName="block w-full"
        className="mx-auto h-auto max-h-[72vh] w-full bg-[var(--surface-strong)] object-contain"
        onLoad={(event) => setAspect(getArticleMediaAspect(event.currentTarget))}
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

function articleHasCompleteEnglish(excerpt: BilingualValue, blocks: ArticleContentBlock[]) {
  if (!excerpt.en?.trim()) {
    return false;
  }

  const hasComparableParagraphTranslation = (content: BilingualValue) => {
    const zhLength = content.zh?.trim().length ?? 0;
    const enLength = content.en?.trim().length ?? 0;

    if (!zhLength) {
      return true;
    }

    if (!enLength) {
      return false;
    }

    // Several legacy articles contain shifted or partial English blocks. Keep
    // those articles wholly Chinese instead of presenting a broken EN reading.
    const expansionRatio = enLength / zhLength;
    return zhLength < 20 ? enLength <= 160 : expansionRatio >= 1.45 && expansionRatio <= 6;
  };

  return blocks.every((block) => {
    if (block.type === "paragraph") {
      return hasComparableParagraphTranslation(block.content);
    }

    if (block.type === "image") {
      return !block.caption.zh?.trim() || Boolean(block.caption.en?.trim());
    }

    return block.items.every((item) => !item.caption.zh?.trim() || Boolean(item.caption.en?.trim()));
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
  const hasEnglish = useMemo(() => articleHasCompleteEnglish(excerpt, blocks), [blocks, excerpt]);
  const excerptParagraphs = useMemo(
    () => getParagraphsByLocale(excerpt, locale, "soft", { autoSplitLongSingleParagraph: false }),
    [excerpt, locale],
  );
  const excerptLead = excerptParagraphs[0]?.trim() ?? "";
  let checkedFirstBodyParagraph = false;

  return (
    <div className={className}>
      {hasEnglish ? (
        <div className="article-reading-toolbar mx-auto mb-5 flex max-w-[40rem] justify-end md:mb-6">
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

      <div className="article-reading-flow">
        {excerptParagraphs.length ? (
          <div className="article-reading-lead space-y-5 md:space-y-6">
            {excerptParagraphs.map((paragraph, index) => (
              <p
                key={`excerpt-${locale}-${index}`}
                lang={locale === "en" ? "en" : "zh-CN"}
                className={proseClasses("lead", locale)}
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        {blocks.map((block, index) => {
          if (block.type === "paragraph") {
            const paragraphs = getParagraphsByLocale(block.content, locale, "paragraph", {
              autoSplitLongSingleParagraph: false,
            });

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
              <div key={`paragraph-${index}`} className="article-reading-copy space-y-5 md:space-y-6">
                {paragraphsForRender.map((paragraph, paragraphIndex) => (
                  <p
                    key={`paragraph-${index}-${locale}-${paragraphIndex}`}
                    lang={locale === "en" ? "en" : "zh-CN"}
                    className={proseClasses("body", locale)}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            );
          }

          if (block.type === "image") {
            return <ArticleImageFigure key={`image-${index}`} block={block} index={index} locale={locale} />;
          }

          const visibleItems = block.items.filter((item) => item.image.trim());

          if (!visibleItems.length) {
            return null;
          }

          return (
            <div
              key={`image-pair-${index}`}
              className={`article-reading-media article-reading-media--group mx-auto grid w-full ${ARTICLE_LANDSCAPE_MEDIA_MAX_WIDTH_CLASS} gap-4 md:gap-5 ${
                visibleItems.length > 1 ? "md:grid-cols-2" : ""
              }`}
            >
              {visibleItems.map((item, itemIndex) => (
                <ArticleImagePairFigure
                  key={`image-pair-${index}-${itemIndex}`}
                  item={item}
                  index={index}
                  itemIndex={itemIndex}
                  locale={locale}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
