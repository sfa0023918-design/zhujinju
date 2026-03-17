import type { BilingualText } from "./data/types";

export type CopyFixRule = {
  wrong: string;
  correct: string;
  pattern: RegExp;
};

export const KNOWN_ZH_COPY_TYPO_FIXES: CopyFixRule[] = [
  { wrong: "释迦摩尼", correct: "释迦牟尼", pattern: /释迦\s*摩尼/g },
  { wrong: "鼎峰", correct: "巅峰", pattern: /鼎\s*峰/g },
  { wrong: "吉尔吉很", correct: "吉尔吉特", pattern: /吉尔吉\s*很/g },
  { wrong: "岁感受到", correct: "所感受到", pattern: /岁\s*感受到/g },
  { wrong: "正翻看到", correct: "正翻看", pattern: /正\s*翻看到/g },
  { wrong: "恰然相反", correct: "恰恰相反", pattern: /恰然相反/g },
];

const KNOWN_ENGLISH_TERM_FIXES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bTibet\b/g, replacement: "Xizang" },
];

const CJK_CHAR_PATTERN = /[\u3400-\u9FFF]/;
const LATIN_CHAR_PATTERN = /[A-Za-z]/;

export type CopyCleanupStats = {
  typoFixes: number;
  englishTermFixes: number;
  swappedBilingualPairs: number;
  normalizedBilingualPairs: number;
};

function emptyStats(): CopyCleanupStats {
  return {
    typoFixes: 0,
    englishTermFixes: 0,
    swappedBilingualPairs: 0,
    normalizedBilingualPairs: 0,
  };
}

function mergeStats(base: CopyCleanupStats, delta: CopyCleanupStats) {
  base.typoFixes += delta.typoFixes;
  base.englishTermFixes += delta.englishTermFixes;
  base.swappedBilingualPairs += delta.swappedBilingualPairs;
  base.normalizedBilingualPairs += delta.normalizedBilingualPairs;
}

function countRegexMatches(value: string, pattern: RegExp) {
  if (!value) {
    return 0;
  }

  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  const matches = value.match(regex);
  return matches ? matches.length : 0;
}

function applyTextFixRules(
  value: string,
  rules: Array<{ pattern: RegExp; replacement: string }>,
) {
  let next = value;
  let replacements = 0;

  for (const rule of rules) {
    replacements += countRegexMatches(next, rule.pattern);
    next = next.replace(rule.pattern, rule.replacement);
  }

  return {
    text: next,
    replacements,
  };
}

function looksLikeSwappedBilingual(zh: string, en: string) {
  if (!zh || !en) {
    return false;
  }

  const zhHasCjk = CJK_CHAR_PATTERN.test(zh);
  const enHasCjk = CJK_CHAR_PATTERN.test(en);
  const zhHasLatin = LATIN_CHAR_PATTERN.test(zh);
  const enHasLatin = LATIN_CHAR_PATTERN.test(en);

  return !zhHasCjk && zhHasLatin && enHasCjk && !enHasLatin;
}

function isBilingualTextRecord(value: unknown): value is BilingualText {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.length === 2 && keys.includes("zh") && keys.includes("en") && typeof record.zh === "string" && typeof record.en === "string";
}

function normalizeBilingualTextValue(value: BilingualText) {
  const stats = emptyStats();
  let zh = value.zh.trim();
  let en = value.en.trim();

  if (looksLikeSwappedBilingual(zh, en)) {
    [zh, en] = [en, zh];
    stats.swappedBilingualPairs += 1;
  }

  const zhFixed = applyTextFixRules(
    zh,
    KNOWN_ZH_COPY_TYPO_FIXES.map((item) => ({ pattern: item.pattern, replacement: item.correct })),
  );
  const enFixed = applyTextFixRules(en, KNOWN_ENGLISH_TERM_FIXES);

  stats.typoFixes += zhFixed.replacements;
  stats.englishTermFixes += enFixed.replacements;
  stats.normalizedBilingualPairs += 1;

  return {
    value: {
      zh: zhFixed.text,
      en: enFixed.text,
    },
    stats,
  };
}

function normalizeAny(value: unknown): { value: unknown; stats: CopyCleanupStats } {
  if (Array.isArray(value)) {
    const stats = emptyStats();
    const next = value.map((item) => {
      const normalized = normalizeAny(item);
      mergeStats(stats, normalized.stats);
      return normalized.value;
    });

    return { value: next, stats };
  }

  if (!value || typeof value !== "object") {
    return { value, stats: emptyStats() };
  }

  if (isBilingualTextRecord(value)) {
    return normalizeBilingualTextValue(value);
  }

  const stats = emptyStats();
  const next: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    const normalized = normalizeAny(item);
    next[key] = normalized.value;
    mergeStats(stats, normalized.stats);
  }

  return { value: next, stats };
}

export function normalizeBilingualFieldsDeep<T>(value: T): { value: T; stats: CopyCleanupStats } {
  const normalized = normalizeAny(value);
  return {
    value: normalized.value as T,
    stats: normalized.stats,
  };
}
