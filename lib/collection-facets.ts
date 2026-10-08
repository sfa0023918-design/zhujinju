import { getArtworkStatusText } from "./bilingual";
import type { BilingualText } from "./data/types";
import type {
  CollectionArtworkSummary,
  CollectionFilterKey,
  CollectionFilterState,
} from "./collection-filtering";

// Filter groups for the collection page. They only decide how the filter menus
// group works; every artwork's own period, region and material text is unchanged.
// When a value does not fit any group, it still appears under its own wording.

type FacetGroup = {
  value: string;
  label: BilingualText;
};

type PeriodGroup = FacetGroup & { from: number; to: number };

export type FacetOption = {
  value: string;
  label: BilingualText;
  count: number;
};

export type CollectionFacets = Record<CollectionFilterKey, { total: number; options: FacetOption[] }>;

export const PERIOD_GROUPS: PeriodGroup[] = [
  { value: "1–5世纪", label: { zh: "1–5世纪", en: "1st–5th century" }, from: 1, to: 5 },
  { value: "6–10世纪", label: { zh: "6–10世纪", en: "6th–10th century" }, from: 6, to: 10 },
  { value: "11–12世纪", label: { zh: "11–12世纪", en: "11th–12th century" }, from: 11, to: 12 },
  { value: "13–14世纪", label: { zh: "13–14世纪", en: "13th–14th century" }, from: 13, to: 14 },
  { value: "15–16世纪", label: { zh: "15–16世纪", en: "15th–16th century" }, from: 15, to: 16 },
  { value: "17世纪及以后", label: { zh: "17世纪及以后", en: "17th century and later" }, from: 17, to: 99 },
];

export const REGION_GROUPS: Array<FacetGroup & { pattern: RegExp }> = [
  { value: "西藏", label: { zh: "西藏", en: "Xizang" }, pattern: /西藏/ },
  { value: "尼泊尔", label: { zh: "尼泊尔", en: "Nepal" }, pattern: /尼泊尔/ },
  { value: "印度", label: { zh: "印度", en: "India" }, pattern: /印度|比哈尔/ },
  {
    value: "犍陀罗地区",
    label: { zh: "犍陀罗地区", en: "Gandhara (Pakistan / Afghanistan)" },
    pattern: /犍陀罗|巴基斯坦|阿富汗/,
  },
  {
    value: "北京宫廷与西夏",
    label: { zh: "北京宫廷与西夏", en: "Beijing Court & Western Xia" },
    pattern: /北京|西夏|黑水城/,
  },
];

export const MATERIAL_GROUPS: FacetGroup[] = [
  { value: "铜鎏金", label: { zh: "铜鎏金", en: "Gilt copper alloy" } },
  { value: "合金铜", label: { zh: "合金铜", en: "Copper alloy" } },
  { value: "金银", label: { zh: "金银", en: "Gold & silver" } },
  { value: "铁", label: { zh: "铁", en: "Iron" } },
  { value: "石", label: { zh: "石", en: "Stone" } },
  { value: "泥塑", label: { zh: "泥塑", en: "Clay" } },
  { value: "木", label: { zh: "木", en: "Wood" } },
  { value: "绘画", label: { zh: "绘画", en: "Painting" } },
  { value: "贝叶写本", label: { zh: "贝叶写本", en: "Palm-leaf manuscript" } },
  { value: "织绣", label: { zh: "织绣", en: "Textile" } },
];

// One consistent English name per category in the menu (the data has a few variants).
export const CATEGORY_LABELS: Record<string, string> = {
  造像: "Sculpture",
  唐卡: "Thangka",
  法器: "Ritual Implements",
  犍陀罗: "Gandhara",
  上师: "Lamas & Teachers",
  经书: "Manuscript",
  佛塔: "Stupa",
  成就者: "Mahasiddhas",
  刺绣: "Embroidery",
  经书板: "Manuscript Cover",
  家具: "Furniture",
};

const GROUPED_KEYS = ["period", "region", "material"] as const;
type GroupedKey = (typeof GROUPED_KEYS)[number];

function isGroupedKey(key: CollectionFilterKey): key is GroupedKey {
  return (GROUPED_KEYS as readonly string[]).includes(key);
}

export function getCenturies(periodZh: string) {
  if (periodZh.includes("清")) {
    return [17, 18, 19];
  }

  const numbers = Array.from(periodZh.matchAll(/\d{1,2}/g), (match) => Number(match[0]));
  if (!numbers.length) {
    return [];
  }

  const from = Math.min(...numbers);
  const to = Math.max(...numbers);
  if (to - from > 5) {
    return numbers;
  }

  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

function getPeriodGroups(periodZh: string) {
  const centuries = getCenturies(periodZh);
  return PERIOD_GROUPS
    .filter((group) => centuries.some((century) => century >= group.from && century <= group.to))
    .map((group) => group.value);
}

function getRegionGroups(regionZh: string) {
  return REGION_GROUPS.filter((group) => group.pattern.test(regionZh)).map((group) => group.value);
}

function getMaterialGroups(materialZh: string) {
  const first = materialZh.split(/[、，,;；]/)[0] ?? "";

  if (/岩|石/.test(first)) return ["石"];
  if (/泥/.test(first)) return ["泥塑"];
  if (/棕榈|贝叶/.test(materialZh)) return ["贝叶写本"];
  if (/绣/.test(materialZh)) return ["织绣"];
  if (/铜/.test(first) && /鎏金/.test(first)) return ["铜鎏金"];
  if (/铜/.test(first)) return ["合金铜"];
  if (/铁/.test(first)) return ["铁"];
  if (/黄金|银/.test(materialZh)) return ["金银"];
  if (/设色|彩绘|绘彩/.test(materialZh) && /布|纸|棉|木板/.test(first)) return ["绘画"];
  if (/木/.test(first)) return ["木"];
  return [];
}

// The groups an artwork belongs to for one filter. Works spanning two periods
// (for example 14th–15th century) are listed under both.
export function getArtworkGroups(artwork: CollectionArtworkSummary, key: GroupedKey) {
  if (key === "period") return getPeriodGroups(artwork.period.zh);
  if (key === "region") return getRegionGroups(artwork.region.zh);
  return getMaterialGroups(artwork.material.zh);
}

function getRawValue(artwork: CollectionArtworkSummary, key: CollectionFilterKey) {
  return key === "status" ? artwork.status : artwork[key].zh;
}

function getGroupList(key: GroupedKey): FacetGroup[] {
  if (key === "period") return PERIOD_GROUPS;
  if (key === "region") return REGION_GROUPS;
  return MATERIAL_GROUPS;
}

function isGroupValue(key: GroupedKey, value: string) {
  return getGroupList(key).some((group) => group.value === value);
}

// A filter value is either one of the groups above or, for older shared links, the
// exact wording stored on an artwork.
export function artworkMatchesFilter(
  artwork: CollectionArtworkSummary,
  key: CollectionFilterKey,
  value: string,
) {
  if (isGroupedKey(key) && isGroupValue(key, value)) {
    const groups = getArtworkGroups(artwork, key);
    return groups.length ? groups.includes(value) : getRawValue(artwork, key) === value;
  }

  return getRawValue(artwork, key) === value;
}

function getArtworkOptionValues(artwork: CollectionArtworkSummary, key: CollectionFilterKey) {
  if (isGroupedKey(key)) {
    const groups = getArtworkGroups(artwork, key);
    if (groups.length) return groups;
  }

  return [getRawValue(artwork, key)];
}

function getFallbackLabel(artworks: CollectionArtworkSummary[], key: CollectionFilterKey, value: string) {
  if (key === "status") {
    const status = artworks.find((artwork) => artwork.status === value)?.status;
    return status ? getArtworkStatusText(status) : { zh: value, en: value };
  }

  if (key === "category") {
    const found = artworks.find((artwork) => artwork.category.zh === value)?.category;
    return { zh: value, en: CATEGORY_LABELS[value] ?? found?.en ?? value };
  }

  return artworks.find((artwork) => artwork[key].zh === value)?.[key] ?? { zh: value, en: value };
}

function matchesOtherFilters(
  artwork: CollectionArtworkSummary,
  filters: CollectionFilterState,
  skip: CollectionFilterKey,
) {
  return (Object.keys(filters) as CollectionFilterKey[]).every((key) => {
    const value = filters[key];
    return key === skip || !value || artworkMatchesFilter(artwork, key, value);
  });
}

// Builds each filter menu: only options that still have works under the other
// filters chosen, each with its count. The current choice always stays visible.
export function buildCollectionFacets(
  artworks: CollectionArtworkSummary[],
  filters: CollectionFilterState,
  keys: readonly CollectionFilterKey[],
): CollectionFacets {
  const facets = {} as CollectionFacets;

  keys.forEach((key) => {
    const base = artworks.filter((artwork) => matchesOtherFilters(artwork, filters, key));
    const counts = new Map<string, number>();
    const order: string[] = [];

    artworks.forEach((artwork) => {
      getArtworkOptionValues(artwork, key).forEach((value) => {
        if (!order.includes(value)) order.push(value);
      });
    });
    base.forEach((artwork) => {
      getArtworkOptionValues(artwork, key).forEach((value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      });
    });

    const groupOrder = isGroupedKey(key) ? getGroupList(key).map((group) => group.value) : [];
    const values = [
      ...groupOrder.filter((value) => order.includes(value)),
      ...order.filter((value) => !groupOrder.includes(value)),
    ];
    const current = filters[key];
    if (current && !values.includes(current)) {
      values.push(current);
    }

    const options = values
      .filter((value) => (counts.get(value) ?? 0) > 0 || value === current)
      .map((value) => {
        const group = isGroupedKey(key)
          ? getGroupList(key).find((item) => item.value === value)
          : undefined;

        return {
          value,
          label: group?.label ?? getFallbackLabel(artworks, key, value),
          count: base.filter((artwork) => artworkMatchesFilter(artwork, key, value)).length,
        };
      });

    facets[key] = { total: base.length, options };
  });

  return facets;
}
