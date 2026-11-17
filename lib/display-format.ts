import type { BilingualText, Exhibition } from "./data/types";

// Presentation only: retain the recorded numbers, units and academic wording.
export function formatDimensions(value: string) {
  return value.replace(/(\d)\s*(cm|mm|m)(?=$|[^a-z])/gi, "$1 $2");
}

export function formatExhibitionPeriod(period: BilingualText): BilingualText {
  return {
    zh: period.zh.replace(/\s*[-–]\s*/g, "–"),
    en: period.en.replace(/\s*[-–]\s*/g, "–"),
  };
}

export function getExhibitionStatus(exhibition: Pick<Exhibition, "current" | "period">, now = new Date()): BilingualText | null {
  if (exhibition.current) return { zh: "展览中", en: "On view" };
  const dates = [...exhibition.period.zh.matchAll(/(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/g)];
  if (!dates.length) return null;
  const end = dates.at(-1)!;
  // Dates belong to the gallery's China time zone, including the closing day.
  const closing = Date.parse(`${end[1]}-${end[2].padStart(2, "0")}-${end[3].padStart(2, "0")}T23:59:59+08:00`);
  return Number.isFinite(closing) && now.getTime() > closing
    ? { zh: "已结束", en: "Past" }
    : null;
}

export function getExhibitionMetadataTitle(title: BilingualText): BilingualText {
  return {
    zh: title.zh.replace(/^竹[瑾璟]居\s*[|｜]\s*/, ""),
    en: title.en.replace(/^Zhu Jin Ju\s*[|｜]\s*/i, ""),
  };
}
