import type {
  Article,
  Artwork,
  BilingualText,
  Exhibition,
} from "@/lib/data/types";
import { resolveArtworkPrimaryImage, withImageVersion } from "@/lib/image-url";

export type V3CategoryKey = "all" | "sculpture" | "painting" | "manuscript" | "ritual";

/**
 * Frontend-only category grouping for the V3.8 collection tabs.
 * Maps 上师 / 成就者 / 犍陀罗 sculptures into "sculpture" without mutating CMS records.
 */
export function getV3CategoryKey(
  artwork: Pick<Artwork, "category">,
): Exclude<V3CategoryKey, "all"> {
  const s = `${artwork.category?.zh ?? ""} ${artwork.category?.en ?? ""}`.toLowerCase();
  if (/造像|雕塑|上师|成就者|犍陀罗|sculpture|statue|lama|teachers|mahasiddha|gandhara/.test(s)) {
    return "sculpture";
  }
  if (/唐卡|绘画|刺绣|thangka|painting|embroidery/.test(s)) {
    return "painting";
  }
  if (/经书|经板|贝叶|经|manuscript|sutra/.test(s)) {
    return "manuscript";
  }
  return "ritual";
}

export function padNumber(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

export function splitParagraphs(text: string | undefined | null): string[] {
  return String(text ?? "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function extractYear(periodZh: string | undefined): string {
  const match = String(periodZh ?? "").match(/20\d{2}/);
  return match ? match[0] : "";
}

export function sortExhibitionsNewest(exhibitions: readonly Exhibition[]): Exhibition[] {
  return [...exhibitions].sort(
    (a, b) => Number(extractYear(b.period.zh) || 0) - Number(extractYear(a.period.zh) || 0),
  );
}

export function isFlagshipExhibition(
  exhibition: Exhibition | undefined,
  allExhibitions: readonly Exhibition[],
): boolean {
  if (!exhibition) return false;
  const sorted = sortExhibitionsNewest(allExhibitions);
  return Boolean(exhibition.current || exhibition.slug === sorted[0]?.slug);
}

export function exhibitionHref(
  exhibition: Exhibition,
  allExhibitions: readonly Exhibition[],
): string {
  return isFlagshipExhibition(exhibition, allExhibitions)
    ? "/exhibitions"
    : `/exhibitions/${exhibition.slug}`;
}

export function getArtworkRatio(artwork: Pick<Artwork, "imageAsset">): number {
  const w = artwork.imageAsset?.width;
  const h = artwork.imageAsset?.height;
  if (w && h && w > 0 && h > 0) return w / h;
  return 0.8;
}

export function getArtworkCardSrc(artwork: Pick<Artwork, "image" | "imageAsset">): string {
  const raw =
    artwork.imageAsset?.card ||
    artwork.imageAsset?.screen ||
    artwork.imageAsset?.detail ||
    resolveArtworkPrimaryImage(artwork);
  return raw ? withImageVersion(raw) : "";
}

export function getArtworkDetailPhotos(
  artwork: Pick<Artwork, "image" | "imageAsset" | "gallery" | "galleryAssets">,
): string[] {
  const primary =
    artwork.imageAsset?.detail ||
    artwork.imageAsset?.screen ||
    artwork.imageAsset?.original ||
    resolveArtworkPrimaryImage(artwork);
  const extras = (artwork.gallery ?? []).map((src, i) => {
    const asset = artwork.galleryAssets?.[i];
    return asset?.detail || asset?.screen || asset?.original || src;
  });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [primary, ...extras]) {
    const trimmed = (item ?? "").trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(withImageVersion(trimmed));
  }
  return out;
}

export function getArtworkFacts(
  artwork: Pick<Artwork, "region" | "period" | "material" | "dimensions">,
  keys: ReadonlyArray<"region" | "period" | "material" | "dimensions"> = ["region", "period"],
): BilingualText {
  const zh = keys
    .map((k) => artwork[k]?.zh?.trim())
    .filter(Boolean)
    .join(" · ");
  const en = keys
    .map((k) => (artwork[k]?.en || artwork[k]?.zh)?.trim())
    .filter(Boolean)
    .join(" · ");
  return { zh, en };
}

export function getPaginationItems(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }
  const set = Array.from(
    new Set([1, total, current - 1, current, current + 1]),
  )
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  set.forEach((p, idx) => {
    if (idx > 0 && p - set[idx - 1] > 1) {
      items.push("ellipsis");
    }
    items.push(p);
  });
  return items;
}

export function countExhibitionWorks(
  exhibition: Exhibition,
  artworks: readonly Artwork[],
): number {
  const year = extractYear(exhibition.period.zh);
  const matched = year
    ? artworks.filter((a) =>
        (a.exhibitions ?? []).some((e) => String(e.year).includes(year)),
      ).length
    : 0;
  return (
    exhibition.featuredWorksCount ||
    exhibition.highlightCount ||
    matched ||
    exhibition.highlightArtworkSlugs.length
  );
}

export type V3SearchIndex = {
  artworks: Array<{
    slug: string;
    title: BilingualText;
    region: BilingualText;
    period: BilingualText;
    material: BilingualText;
    category: BilingualText;
    dimensions: BilingualText;
    status: Artwork["status"];
    card: string;
  }>;
  articles: Array<{
    slug: string;
    title: BilingualText;
    category: BilingualText;
    cover: string;
  }>;
};

export function buildSearchIndex(
  artworks: readonly Artwork[],
  articles: readonly Article[],
  resolveCover: (article: Article) => string,
): V3SearchIndex {
  return {
    artworks: artworks.map((a) => ({
      slug: a.slug,
      title: a.title,
      region: a.region,
      period: a.period,
      material: a.material,
      category: a.category,
      dimensions: a.dimensions,
      status: a.status,
      card: getArtworkCardSrc(a),
    })),
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      cover: withImageVersion(resolveCover(a)),
    })),
  };
}
