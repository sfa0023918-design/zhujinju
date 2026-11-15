"use client";

import { useState } from "react";
import type { BilingualText as BilingualValue } from "@/lib/site-data";
import {
  BilingualReadingPanel,
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
  const sections = [
    { key: id ?? "reading", content, variant: "body" as const, expandable },
  ];
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
      {(["zh", "en"] as const).map((value) => (
        <div
          key={value}
          data-locale={value}
          data-active={locale === value}
          className={styles.column}
        >
          <BilingualReadingPanel
            sections={sections}
            locale={value}
            showToggle={false}
            singleLineBreakMode="paragraph"
            manualParagraphMode="preserve"
            autoSplitLongSingleParagraph={false}
            repairWrappedLines
            paragraphClassName={styles.paragraph}
          />
        </div>
      ))}
    </section>
  );
}
