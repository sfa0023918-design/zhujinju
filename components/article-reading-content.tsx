"use client";

import { useId, useMemo, useState } from "react";

import type {
  ArticleContentBlock,
  ArticleImageBlock,
  ArticleImagePairItem,
  BilingualText as BilingualValue,
} from "@/lib/site-data";
import { withImageVersion } from "@/lib/image-url";

import { ExpandableReadingText, getLocalizedText, getParagraphsByLocale } from "./bilingual-prose";
import { ProtectedImage } from "./protected-image";

const ARTICLE_TEXT_MAX_WIDTH_CLASS = "max-w-[40rem]";
const ARTICLE_LANDSCAPE_MEDIA_MAX_WIDTH_CLASS = "max-w-[52rem]";
const ARTICLE_BALANCED_MEDIA_MAX_WIDTH_CLASS = "max-w-[40rem]";
const ARTICLE_INLINE_MEDIA_MAX_WIDTH_CLASS = "max-w-[31rem]";
function ArticleCaption({ caption, bilingual, id }: { caption: BilingualValue; bilingual: boolean; id: string }) {
  return (
    <figcaption id={id} className="mx-auto max-w-full pt-1 text-center text-[0.8125rem] leading-[1.72] text-[var(--muted)]">
      <span lang="zh-CN" data-reading-locale="zh">{getLocalizedText(caption, "zh")}</span>
      {bilingual ? <span lang="en" data-reading-locale="en">{getLocalizedText(caption, "en")}</span> : null}
    </figcaption>
  );
}

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
  bilingual,
}: {
  block: ArticleImageBlock;
  index: number;
  bilingual: boolean;
}) {
  const [aspect, setAspect] = useState<ArticleMediaAspect>("balanced");
  const caption = getLocalizedText(block.caption, "zh");
  const captionId = useId();

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
        aria-labelledby={caption ? captionId : undefined}
        alt={caption || `Article reference ${index + 1}`}
        width={1600}
        height={1200}
        unoptimized={!block.image.startsWith("/uploads/")}
        sizes="(max-width: 860px) calc(100vw - 40px), 832px"
        quality={85}
        wrapperClassName="block w-full"
        className="mx-auto h-auto max-h-[72vh] w-full bg-[var(--surface-strong)] object-contain"
        onLoad={(event) => setAspect(getArticleMediaAspect(event.currentTarget))}
      />
      {caption ? (
        <ArticleCaption id={captionId} caption={block.caption} bilingual={bilingual} />
      ) : null}
    </figure>
  );
}

function ArticleImagePairFigure({
  item,
  index,
  itemIndex,
  bilingual,
}: {
  item: ArticleImagePairItem;
  index: number;
  itemIndex: number;
  bilingual: boolean;
}) {
  const [aspect, setAspect] = useState<ArticleMediaAspect>("balanced");
  const caption = getLocalizedText(item.caption, "zh");
  const captionId = useId();

  return (
    <figure
      data-media-aspect={aspect}
      className="flex min-w-0 flex-col items-center justify-start space-y-3"
    >
      <ProtectedImage
        src={withImageVersion(item.image)}
        aria-labelledby={caption ? captionId : undefined}
        alt={caption || `Article reference ${index + 1}-${itemIndex + 1}`}
        width={1200}
        height={900}
        unoptimized={!item.image.startsWith("/uploads/")}
        sizes="(max-width: 640px) calc(100vw - 40px), 416px"
        quality={85}
        wrapperClassName="block w-full"
        className="mx-auto h-auto max-h-[72vh] w-full bg-[var(--surface-strong)] object-contain"
        onLoad={(event) => setAspect(getArticleMediaAspect(event.currentTarget))}
      />
      {caption ? (
        <ArticleCaption id={captionId} caption={item.caption} bilingual={bilingual} />
      ) : null}
    </figure>
  );
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
  const languageGroup = useId();
  const hasEnglish = useMemo(() => articleHasCompleteEnglish(excerpt, blocks), [blocks, excerpt]);
  const readingBlocks = useMemo(() => {
    type ProseRun = { type: "reading"; paragraphs: { zh: string[]; en: string[] } };
    const result: (ProseRun | Exclude<ArticleContentBlock, { type: "paragraph" }>)[] = [];
    const first = { zh: "", en: "" };
    const excerptText = { zh: [] as string[], en: [] as string[] };
    for (const value of ["zh", "en"] as const) {
      excerptText[value] = getParagraphsByLocale(excerpt, value, "soft", { autoSplitLongSingleParagraph: false, repairWrappedLines: true });
      first[value] = excerptText[value][0]?.trim() ?? "";
    }
    result.push({ type: "reading", paragraphs: excerptText });
    let checkedFirst = false;
    for (const block of blocks) {
      if (block.type !== "paragraph") { result.push(block); continue; }
      const paragraphs = { zh: [] as string[], en: [] as string[] };
      for (const value of ["zh", "en"] as const) {
        paragraphs[value] = getParagraphsByLocale(block.content, value, "paragraph", { autoSplitLongSingleParagraph: false, repairWrappedLines: true });
        if (!checkedFirst && paragraphs[value].length) {
          const [lead, ...rest] = paragraphs[value];
          const trimmed = trimDuplicatedLead(first[value], lead);
          paragraphs[value] = trimmed ? [trimmed, ...rest] : rest;
        }
      }
      checkedFirst = true;
      const previous = result.at(-1);
      if (previous?.type === "reading") {
        previous.paragraphs.zh.push(...paragraphs.zh);
        previous.paragraphs.en.push(...paragraphs.en);
      } else result.push({ type: "reading", paragraphs });
    }
    return result;
  }, [blocks, excerpt]);

  return (
    <div className={className} data-reading-picker={hasEnglish || undefined}>
      {hasEnglish ? (
        <div className="article-reading-toolbar mx-auto mb-5 flex max-w-[40rem] justify-end md:mb-6">
          <div role="radiogroup" aria-label="阅读语言 / Reading language" className="inline-flex items-center rounded-full border border-[var(--line)]/28 p-1">
            {(["zh", "en"] as const).map((option) => (
              <label key={option} lang={option === "en" ? "en" : "zh-CN"}
                className="relative inline-grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-full px-3 py-1 text-xs tracking-[0.03em] text-[var(--accent-text)] transition-colors hover:text-[var(--ink)] has-checked:bg-[var(--surface)] has-checked:text-[var(--ink)] has-focus-visible:outline-2">
                <input className="sr-only" type="radio" name={languageGroup} value={option} defaultChecked={option === "zh"} />
                {option === "zh" ? "中文" : "English"}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="article-reading-flow">
        {readingBlocks.map((block, index) => {
          if (block.type === "reading") {
            return <div key={`reading-${index}`} className={`article-reading-copy mx-auto ${ARTICLE_TEXT_MAX_WIDTH_CLASS}`}>
              <ExpandableReadingText expandLabel={{ zh: "展开本节", en: "Read this section" }} translations={hasEnglish ? block.paragraphs : undefined}
                paragraphs={block.paragraphs.zh} renderLocaleOptions={hasEnglish} />
            </div>;
          }

          if (block.type === "image") {
            return <ArticleImageFigure key={`image-${index}`} block={block} index={index} bilingual={hasEnglish} />;
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
                  bilingual={hasEnglish}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
