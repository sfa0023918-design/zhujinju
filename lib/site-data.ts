export type { Article, Artwork, ArtworkStatus, BilingualText, Exhibition } from "./data/types";
export { articles } from "./data/articles";
export { artworks } from "./data/artworks";
export { brandIntro, collectingDirections, trustPillars } from "./data/brand";
export { exhibitions } from "./data/exhibitions";
export { siteConfig } from "./site-config";

import { bt } from "./bilingual";
import { articles } from "./data/articles";
import { artworks } from "./data/artworks";
import { exhibitions } from "./data/exhibitions";
import type { Artwork, BilingualText } from "./data/types";

function getUniqueBilingual(items: BilingualText[]) {
  const map = new Map<string, BilingualText>();

  items.forEach((item) => {
    if (!map.has(item.zh)) {
      map.set(item.zh, item);
    }
  });

  return Array.from(map.values());
}

export const featuredArtworks = artworks.filter((artwork) => artwork.featured);

export const currentExhibition =
  exhibitions.find((exhibition) => exhibition.current) ?? exhibitions[0];

export const filterOptions = {
  all: bt("全部", "All"),
  categories: getUniqueBilingual(artworks.map((artwork) => artwork.category)),
  regions: getUniqueBilingual(artworks.map((artwork) => artwork.region)),
  periods: getUniqueBilingual(artworks.map((artwork) => artwork.period)),
  materials: getUniqueBilingual(artworks.map((artwork) => artwork.material)),
};

export function getArtworkBySlug(slug: string) {
  return artworks.find((artwork) => artwork.slug === slug);
}

export function getExhibitionBySlug(slug: string) {
  return exhibitions.find((exhibition) => exhibition.slug === slug);
}

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getRelatedArtworks(currentSlug: string, categoryZh: string) {
  return artworks
    .filter((artwork) => artwork.slug !== currentSlug && artwork.category.zh === categoryZh)
    .slice(0, 3);
}

export function getFilteredArtworks(filters: {
  category?: string;
  region?: string;
  period?: string;
  material?: string;
}) {
  return artworks.filter((artwork) => {
    const categoryMatch =
      !filters.category ||
      filters.category === filterOptions.all.zh ||
      artwork.category.zh === filters.category;
    const regionMatch =
      !filters.region || filters.region === filterOptions.all.zh || artwork.region.zh === filters.region;
    const periodMatch =
      !filters.period || filters.period === filterOptions.all.zh || artwork.period.zh === filters.period;
    const materialMatch =
      !filters.material ||
      filters.material === filterOptions.all.zh ||
      artwork.material.zh === filters.material;

    return categoryMatch && regionMatch && periodMatch && materialMatch;
  });
}

export function getHighlightedArtworks(slugs: string[]) {
  return slugs
    .map((slug) => getArtworkBySlug(slug))
    .filter((artwork): artwork is Artwork => Boolean(artwork));
}
