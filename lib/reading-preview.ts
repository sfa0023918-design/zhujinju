export type ReadingParagraphs = { zh: string[]; en: string[] };

// Keep source substrings, punctuation and closing quotations intact.
function sentences(text: string, locale: "zh" | "en") {
  const parts: string[] = [];
  let pending = "";
  for (const { segment } of new Intl.Segmenter(locale, { granularity: "sentence" }).segment(text)) {
    pending += segment;
    if (locale === "en" && /(?:\b(?:Dr|Mr|Mrs|Ms|Prof|St|No|vs)|\b[A-Z])\.\s*$/.test(pending)) continue;
    parts.push(pending);
    pending = "";
  }
  if (pending) parts.push(pending);
  return parts;
}

function lines(paragraphs: string[], columns: number) {
  return paragraphs.reduce((total, text) => total + Math.ceil(text.length / Math.max(1, columns)), 0)
    + Math.max(0, paragraphs.length - 1) * 0.65;
}

function preview(paragraphs: string[], locale: "zh" | "en", columns: number, maxLines: number) {
  if (lines(paragraphs, columns) <= maxLines + 1) return paragraphs;
  const result: string[] = [];
  for (const paragraph of paragraphs) {
    let prefix = "";
    for (const sentence of sentences(paragraph, locale)) {
      const next = prefix + sentence;
      if (lines([...result, next.trimEnd()], columns) > maxLines && (result.length || prefix)) {
        const before = lines([...result, ...(prefix ? [prefix.trimEnd()] : [])], columns);
        const after = lines([...result, next.trimEnd()], columns);
        // Prefer the nearer complete sentence, allowing at most two extra lines.
        if (after <= maxLines + 2 && after - maxLines <= maxLines - before) prefix = next;
        if (prefix) result.push(prefix.trimEnd());
        return result;
      }
      prefix = next;
    }
    result.push(paragraph);
  }
  return result;
}

/** The two languages share a visual reading budget, not a raw character count. */
export function getReadingPreview(
  paragraphs: ReadingParagraphs,
  columns = { zh: 24, en: 56 },
  maxLines = 10,
): ReadingParagraphs {
  return {
    zh: preview(paragraphs.zh, "zh", columns.zh, maxLines),
    en: preview(paragraphs.en, "en", columns.en, maxLines),
  };
}
