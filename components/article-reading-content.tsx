"use client";

import { useMemo, useState } from "react";

import type { ArticleContentBlock, BilingualText as BilingualValue } from "@/lib/site-data";

import { getLocalizedText, getParagraphsByLocale, type ReadingLocale } from "./bilingual-prose";
import { ProtectedImage } from "./protected-image";

function proseClasses(variant: "lead" | "body", locale: ReadingLocale) {
  if (variant === "lead") {
    return locale === "zh"
      ? "prose-block prose-block--zh max-w-[39rem] text-[1.04rem] leading-[2.08] text-[var(--ink)] md:text-[1.08rem]"
      : "prose-block prose-block--en max-w-[31rem] text-[0.93rem] leading-[1.86] text-[var(--muted)]/92 md:text-[0.97rem]";
  }

  return locale === "zh"
    ? "prose-block prose-block--zh max-w-[42rem] text-[1rem] leading-[2.08] text-[var(--muted)]"
    : "prose-block prose-block--en max-w-[33rem] text-[0.9rem] leading-[1.84] text-[var(--muted)]/90";
}

function hasLocalizedContent(content: BilingualValue | undefined, locale: ReadingLocale) {
  return Boolean(locale === "zh" ? content?.zh?.trim() : content?.en?.trim());
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

  return (
    <div className={className}>
      {hasEnglish ? (
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
        {excerptParagraphs.length ? (
          <div className="space-y-4 md:space-y-5">
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
            const paragraphs = getParagraphsByLocale(block.content, locale);

            if (!paragraphs.length) {
              return null;
            }

            return (
              <div key={`paragraph-${index}`} className="space-y-4 md:space-y-5">
                {paragraphs.map((paragraph, paragraphIndex) => (
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
            const caption = getLocalizedText(block.caption, locale);

            return (
              <figure
                key={`image-${index}`}
                className={`space-y-3 ${
                  block.layout === "inline" ? "max-w-[31rem]" : "max-w-[44rem]"
                }`}
              >
                <ProtectedImage
                  src={block.image}
                  alt={caption || `Article reference ${index + 1}`}
                  width={1600}
                  height={1200}
                  unoptimized
                  wrapperClassName="block"
                  className="h-auto w-full object-cover"
                />
                {caption ? (
                  <figcaption
                    lang={locale === "en" ? "en" : "zh-CN"}
                    className={
                      locale === "zh"
                        ? "text-[0.78rem] leading-[1.9] text-[var(--accent)]/84"
                        : "text-[0.72rem] uppercase tracking-[0.12em] leading-[1.72] text-[var(--accent)]/74"
                    }
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
              className={`grid gap-5 ${visibleItems.length > 1 ? "md:grid-cols-2" : ""}`}
            >
              {visibleItems.map((item, itemIndex) => {
                const caption = getLocalizedText(item.caption, locale);

                return (
                  <figure key={`image-pair-${index}-${itemIndex}`} className="space-y-3">
                    <ProtectedImage
                      src={item.image}
                      alt={caption || `Article reference ${index + 1}-${itemIndex + 1}`}
                      width={1200}
                      height={900}
                      unoptimized
                      wrapperClassName="block"
                      className="h-auto w-full object-cover"
                    />
                    {caption ? (
                      <figcaption
                        lang={locale === "en" ? "en" : "zh-CN"}
                        className={
                          locale === "zh"
                            ? "text-[0.78rem] leading-[1.9] text-[var(--accent)]/84"
                            : "text-[0.72rem] uppercase tracking-[0.12em] leading-[1.72] text-[var(--accent)]/74"
                        }
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
