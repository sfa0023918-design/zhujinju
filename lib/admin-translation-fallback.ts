import { readSiteContentFresh } from "./site-data";

type TranslationMemory = Map<string, string>;

const EXACT_GLOSSARY = new Map<string, string>([
  ["帝释天", "Indra"],
  ["弥勒菩萨", "Maitreya Bodhisattva"],
  ["释迦牟尼", "Shakyamuni Buddha"],
  ["释迦牟尼佛", "Buddha Shakyamuni"],
  ["文殊菩萨", "Manjushri"],
  ["金刚手菩萨", "Vajrapani"],
  ["观音", "Avalokiteshvara"],
  ["观世音", "Avalokiteshvara"],
  ["十一面观音", "Ekadasamukha Avalokiteshvara"],
  ["十一面观音坐像", "Seated Ekadasamukha Avalokiteshvara"],
  ["铜造像", "Bronze Sculpture"],
  ["金铜造像", "Gilt Bronze Sculpture"],
  ["鎏金铜造像", "Gilt Bronze Sculpture"],
  ["合金铜造像", "Copper Alloy Sculpture"],
  ["设色唐卡", "Painted Thangka"],
  ["唐卡", "Thangka"],
  ["佛教工艺", "Buddhist Works of Art"],
  ["绘画", "Painting"],
  ["专题展览", "Exhibition"],
  ["图录", "Catalogue"],
  ["西藏", "Tibet"],
  ["西藏中部", "Central Tibet"],
  ["西藏西部", "Western Tibet"],
  ["后藏", "Tsang"],
  ["尼泊尔", "Nepal"],
  ["斯瓦特", "Swat"],
  ["印度", "India"],
  ["藏家", "Collector"],
  ["机构", "Institution"],
  ["策展人", "Curator"],
  ["研究者", "Researcher"],
  ["媒体", "Press"],
  ["欢迎藏家、机构、策展人与研究者联系。", "Collectors, institutions, curators, and researchers are welcome to get in touch."],
  ["浏览藏品", "Browse Collection"],
  ["展览与图录", "Exhibitions & Catalogues"],
  ["文章与研究", "Journal"],
  ["联系", "Contact"],
  ["关于", "About"],
]);

const PHRASE_GLOSSARY = [
  ["西藏中部", "Central Tibet"],
  ["西藏西部", "Western Tibet"],
  ["后藏", "Tsang"],
  ["尼泊尔", "Nepal"],
  ["斯瓦特", "Swat"],
  ["帝释天", "Indra"],
  ["弥勒菩萨", "Maitreya Bodhisattva"],
  ["释迦牟尼佛", "Buddha Shakyamuni"],
  ["释迦牟尼", "Shakyamuni Buddha"],
  ["文殊菩萨", "Manjushri"],
  ["金刚手菩萨", "Vajrapani"],
  ["十一面观音", "Ekadasamukha Avalokiteshvara"],
  ["观世音", "Avalokiteshvara"],
  ["观音", "Avalokiteshvara"],
  ["坐像", "Seated"],
  ["立像", "Standing"],
  ["菩萨", "Bodhisattva"],
  ["佛", "Buddha"],
  ["铜造像", "Bronze Sculpture"],
  ["金铜造像", "Gilt Bronze Sculpture"],
  ["鎏金铜造像", "Gilt Bronze Sculpture"],
  ["合金铜造像", "Copper Alloy Sculpture"],
  ["设色唐卡", "Painted Thangka"],
  ["唐卡", "Thangka"],
  ["佛教工艺", "Buddhist Works of Art"],
  ["绘画", "Painting"],
  ["矿物彩", "mineral pigments"],
  ["棉布", "cotton"],
  ["纸本", "paper"],
  ["丝绢", "silk"],
  ["木雕", "wood carving"],
  ["石雕", "stone carving"],
  ["年代", "Period"],
  ["地区", "Region"],
  ["产地", "Origin"],
  ["材质", "Material"],
  ["尺寸", "Dimensions"],
];

const PUNCTUATION_REPLACEMENTS: Array<[RegExp, string]> = [
  [/（/g, "("],
  [/）/g, ")"],
  [/，/g, ", "],
  [/、/g, ", "],
  [/：/g, ": "],
  [/；/g, "; "],
  [/。/g, "."],
];

let translationMemoryPromise: Promise<TranslationMemory> | null = null;

function normalizeKey(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) {
    return `${n}th`;
  }

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function chineseNumberToInt(raw: string) {
  const text = raw.trim();

  if (/^\d+$/.test(text)) {
    return Number(text);
  }

  const digits: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };

  if (text === "十") {
    return 10;
  }

  if (text.startsWith("十")) {
    return 10 + (digits[text.slice(1)] ?? 0);
  }

  if (text.endsWith("十")) {
    return (digits[text[0]] ?? 0) * 10;
  }

  if (text.includes("十")) {
    const [tens, ones] = text.split("十");
    return (digits[tens] ?? 0) * 10 + (digits[ones] ?? 0);
  }

  return digits[text] ?? null;
}

function translateCentury(text: string) {
  const normalized = text.trim();
  const rangeMatch = normalized.match(/^([一二三四五六七八九十\d]+)\s*[至—-]\s*([一二三四五六七八九十\d]+)世纪$/);

  if (rangeMatch) {
    const start = chineseNumberToInt(rangeMatch[1]);
    const end = chineseNumberToInt(rangeMatch[2]);

    if (start && end) {
      return `${ordinal(start)}–${ordinal(end)} century`;
    }
  }

  const singleMatch = normalized.match(/^([一二三四五六七八九十\d]+)世纪$/);

  if (singleMatch) {
    const value = chineseNumberToInt(singleMatch[1]);

    if (value) {
      return `${ordinal(value)} century`;
    }
  }

  return null;
}

function translateStructuredPhrase(text: string): string | null {
  let output = text.trim();

  const exact = EXACT_GLOSSARY.get(output);
  if (exact) {
    return exact;
  }

  const centuryTranslation = translateCentury(output);
  if (centuryTranslation) {
    return centuryTranslation;
  }

  const objectPhrases = [
    "鎏金铜造像",
    "金铜造像",
    "合金铜造像",
    "铜造像",
    "设色唐卡",
    "唐卡",
  ];

  for (const phrase of objectPhrases) {
    if (output.endsWith(phrase) && output !== phrase) {
      const prefix = output.slice(0, -phrase.length).trim();
      const prefixTranslated = translateStructuredPhrase(prefix);
      const objectTranslated = EXACT_GLOSSARY.get(phrase);

      if (prefixTranslated && objectTranslated) {
        return `${objectTranslated}, ${prefixTranslated}`;
      }
    }
  }

  for (const [zh, en] of PHRASE_GLOSSARY.sort((a, b) => b[0].length - a[0].length)) {
    output = output.replaceAll(zh, en);
  }

  for (const [pattern, replacement] of PUNCTUATION_REPLACEMENTS) {
    output = output.replace(pattern, replacement);
  }

  output = output
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ", ")
    .replace(/\s+\./g, ".")
    .trim();

  return /[\u4e00-\u9fff]/.test(output) ? null : output;
}

function collectBilingualPairs(value: unknown, memory: TranslationMemory) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (
    "zh" in value &&
    "en" in value &&
    typeof (value as { zh?: unknown }).zh === "string" &&
    typeof (value as { en?: unknown }).en === "string"
  ) {
    const zh = normalizeKey((value as { zh: string }).zh);
    const en = normalizeKey((value as { en: string }).en);

    if (zh && en && !memory.has(zh)) {
      memory.set(zh, en);
    }
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectBilingualPairs(item, memory));
    return;
  }

  for (const child of Object.values(value)) {
    collectBilingualPairs(child, memory);
  }
}

async function getTranslationMemory() {
  if (!translationMemoryPromise) {
    translationMemoryPromise = readSiteContentFresh().then((content) => {
      const memory: TranslationMemory = new Map();
      collectBilingualPairs(content, memory);

      for (const [zh, en] of EXACT_GLOSSARY.entries()) {
        memory.set(zh, en);
      }

      return memory;
    });
  }

  return translationMemoryPromise;
}

function buildSentenceFallback(text: string, memory: TranslationMemory) {
  const normalized = normalizeKey(text);
  if (!normalized) {
    return null;
  }

  const glossaryExact = EXACT_GLOSSARY.get(normalized);
  if (glossaryExact) {
    return glossaryExact;
  }

  const exact = memory.get(normalized);
  if (exact) {
    return exact;
  }

  return translateStructuredPhrase(normalized);
}

export async function fallbackTranslateChineseToEnglish(text: string, label?: string) {
  const normalizedText = normalizeKey(text);
  if (!normalizedText) {
    return null;
  }

  const glossaryExact = EXACT_GLOSSARY.get(normalizedText);
  if (glossaryExact) {
    return glossaryExact;
  }

  const memory = await getTranslationMemory();
  const exact = memory.get(normalizedText);

  if (exact) {
    return exact;
  }

  const normalizedLabel = normalizeKey(label ?? "");
  const prefersStructuredFallback =
    /(标题|副标题|年代|地区|产地|材质|尺寸|类别|分类|摘要|简述|封面|地点|日期|栏目|作者|关键词)/.test(normalizedLabel) ||
    normalizedText.length <= 36;

  if (prefersStructuredFallback) {
    return buildSentenceFallback(normalizedText, memory);
  }

  const sentenceFallback = buildSentenceFallback(normalizedText, memory);

  if (sentenceFallback && !/[\u4e00-\u9fff]/.test(sentenceFallback)) {
    return sentenceFallback;
  }

  return null;
}
