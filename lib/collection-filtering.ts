import type { Artwork } from "./data/types";

// Shared by the collection page on the server and in the browser, so filtering and
// pagination can update instantly without asking the server to re-render the page.

export const COLLECTION_FILTER_KEYS = ["category", "region", "period", "material", "status"] as const;

export type CollectionFilterKey = (typeof COLLECTION_FILTER_KEYS)[number];

export type CollectionFilterState = Partial<Record<CollectionFilterKey, string>>;

// Only the fields the collection grid and its filters need. Long texts such as
// viewing notes, provenance and publications stay on the artwork detail page.
export type CollectionArtworkSummary = Pick<
  Artwork,
  "slug" | "title" | "period" | "region" | "material" | "category" | "status" | "image" | "imageAsset"
>;

const ALL_VALUE = "全部";

type SearchParamsReader = {
  get(name: string): string | null;
};

export function toCollectionArtworkSummary(artwork: Artwork): CollectionArtworkSummary {
  return {
    slug: artwork.slug,
    title: artwork.title,
    period: artwork.period,
    region: artwork.region,
    material: artwork.material,
    category: artwork.category,
    status: artwork.status,
    image: artwork.image,
    imageAsset: artwork.imageAsset,
  };
}

function isActiveValue(value: string | null | undefined): value is string {
  return Boolean(value) && value !== ALL_VALUE;
}

export function readCollectionFilters(searchParams: SearchParamsReader): CollectionFilterState {
  const filters: CollectionFilterState = {};

  COLLECTION_FILTER_KEYS.forEach((key) => {
    const value = searchParams.get(key);

    if (isActiveValue(value)) {
      filters[key] = value;
    }
  });

  return filters;
}

export function getCollectionFilterSignature(filters: CollectionFilterState) {
  return COLLECTION_FILTER_KEYS.map((key) => filters[key] ?? "").join("|");
}

export function filterCollectionArtworks<T extends CollectionArtworkSummary>(
  artworks: T[],
  filters: CollectionFilterState,
) {
  return artworks.filter((artwork) => {
    const categoryMatch = !isActiveValue(filters.category) || artwork.category.zh === filters.category;
    const regionMatch = !isActiveValue(filters.region) || artwork.region.zh === filters.region;
    const periodMatch = !isActiveValue(filters.period) || artwork.period.zh === filters.period;
    const materialMatch = !isActiveValue(filters.material) || artwork.material.zh === filters.material;
    const statusMatch = !isActiveValue(filters.status) || artwork.status === filters.status;

    return categoryMatch && regionMatch && periodMatch && materialMatch && statusMatch;
  });
}

export function buildCollectionHref(filters: CollectionFilterState) {
  const params = new URLSearchParams();

  COLLECTION_FILTER_KEYS.forEach((key) => {
    const value = filters[key];

    if (isActiveValue(value)) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/collection?${query}` : "/collection";
}
