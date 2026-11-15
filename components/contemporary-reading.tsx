"use client";

import { useState } from "react";
import type { BilingualText as BilingualValue } from "@/lib/site-data";
import {
  ExpandableReadingText,
  getParagraphsByLocale,
  type BilingualProseContent,
  type ReadingLocale,
} from "./bilingual-prose";
import styles from "./contemporary-reading.module.css";

export function ContemporaryReading({
  id,
  title,
  content,
  expandable = true,
}: {
  id?: string;
  title: BilingualValue;
  content: BilingualProseContent;
  expandable?: boolean;
}) {
  const [locale, setLocale] = useState<ReadingLocale>("zh");
  const paragraphs = {
    zh: getParagraphsByLocale(content, "zh", "paragraph", { autoSplitLongSingleParagraph: false, repairWrappedLines: true }),
    en: getParagraphsByLocale(content, "en", "paragraph", { autoSplitLongSingleParagraph: false, repairWrappedLines: true }),
  };
  return (
    <section id={id} className={styles.reading}>
      <div className={styles.heading}>
        <h2>
          {title.zh}
          <span lang="en">{title.en}</span>
        </h2>
        <div className={styles.tabs} aria-label="阅读语言">
          {(["zh", "en"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={locale === value}
              onClick={() => setLocale(value)}
            >
              {value === "zh" ? "中文" : "English"}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.body}>
        <ExpandableReadingText translations={paragraphs} locale={locale} showBoth expandable={expandable} paragraphClassName={styles.paragraph} />
      </div>
    </section>
  );
}
