#!/usr/bin/env node

import { readFile, writeFile } from "fs/promises";
import path from "path";

const CONTENT_FILE_PATH = path.join(process.cwd(), "content", "site-content.json");
const EDITABLE_SECTIONS = ["artworks", "exhibitions", "articles"];

const ZH_FIXES = [
  { pattern: /释迦\s*摩尼/g, replacement: "释迦牟尼" },
  { pattern: /鼎\s*峰/g, replacement: "巅峰" },
  { pattern: /吉尔吉\s*很/g, replacement: "吉尔吉特" },
  { pattern: /岁\s*感受到/g, replacement: "所感受到" },
  { pattern: /正\s*翻看到/g, replacement: "正翻看" },
  { pattern: /恰然相反/g, replacement: "恰恰相反" },
];

const EN_FIXES = [
  { pattern: /\bTibet\b/g, replacement: "Xizang" },
];

const CJK_CHAR_PATTERN = /[\u3400-\u9FFF]/;
const LATIN_CHAR_PATTERN = /[A-Za-z]/;

function isBilingualRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return keys.length === 2 && keys.includes("zh") && keys.includes("en") && typeof value.zh === "string" && typeof value.en === "string";
}

function countMatches(text, pattern) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function applyFixes(text, rules) {
  let next = text;
  let replacements = 0;

  for (const rule of rules) {
    replacements += countMatches(next, rule.pattern);
    next = next.replace(rule.pattern, rule.replacement);
  }

  return { text: next, replacements };
}

function looksLikeSwappedBilingual(zh, en) {
  if (!zh || !en) {
    return false;
  }

  const zhHasCjk = CJK_CHAR_PATTERN.test(zh);
  const enHasCjk = CJK_CHAR_PATTERN.test(en);
  const zhHasLatin = LATIN_CHAR_PATTERN.test(zh);
  const enHasLatin = LATIN_CHAR_PATTERN.test(en);

  return !zhHasCjk && zhHasLatin && enHasCjk && !enHasLatin;
}

function normalizeBilingualValue(value, stats) {
  let zh = value.zh.trim();
  let en = value.en.trim();

  if (looksLikeSwappedBilingual(zh, en)) {
    [zh, en] = [en, zh];
    stats.swappedBilingualPairs += 1;
  }

  const zhFixed = applyFixes(zh, ZH_FIXES);
  const enFixed = applyFixes(en, EN_FIXES);

  stats.typoFixes += zhFixed.replacements;
  stats.englishTermFixes += enFixed.replacements;
  stats.normalizedBilingualPairs += 1;

  return {
    zh: zhFixed.text,
    en: enFixed.text,
  };
}

function normalizeNode(value, stats) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeNode(item, stats));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (isBilingualRecord(value)) {
    return normalizeBilingualValue(value, stats);
  }

  const next = {};

  for (const [key, item] of Object.entries(value)) {
    next[key] = normalizeNode(item, stats);
  }

  return next;
}

async function main() {
  const raw = await readFile(CONTENT_FILE_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const next = { ...parsed };
  const stats = {
    typoFixes: 0,
    englishTermFixes: 0,
    swappedBilingualPairs: 0,
    normalizedBilingualPairs: 0,
  };

  for (const section of EDITABLE_SECTIONS) {
    if (!Array.isArray(parsed[section])) {
      continue;
    }

    next[section] = normalizeNode(parsed[section], stats);
  }

  const nextRaw = `${JSON.stringify(next, null, 2)}\n`;

  if (nextRaw === raw) {
    console.log("No copy cleanup changes detected.");
    return;
  }

  await writeFile(CONTENT_FILE_PATH, nextRaw, "utf8");
  console.log("Copy cleanup completed.");
  console.log(
    JSON.stringify(
      {
        file: CONTENT_FILE_PATH,
        typoFixes: stats.typoFixes,
        englishTermFixes: stats.englishTermFixes,
        swappedBilingualPairs: stats.swappedBilingualPairs,
        normalizedBilingualPairs: stats.normalizedBilingualPairs,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Copy cleanup failed.");
  console.error(error);
  process.exit(1);
});
