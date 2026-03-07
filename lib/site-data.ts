export type { Article, Artwork, ArtworkStatus, Exhibition } from "./data/types";
export { articles } from "./data/articles";
export { artworks } from "./data/artworks";
export { brandIntro, collectingDirections, trustPillars } from "./data/brand";
export { exhibitions } from "./data/exhibitions";
export { siteConfig } from "./site-config";

import { articles } from "./data/articles";
import { artworks } from "./data/artworks";
import { exhibitions } from "./data/exhibitions";
import type { Artwork } from "./data/types";

export const featuredArtworks = artworks.filter((artwork) => artwork.featured);

export const currentExhibition =
  exhibitions.find((exhibition) => exhibition.current) ?? exhibitions[0];

export const filterOptions = {
  categories: ["全部", ...new Set(artworks.map((artwork) => artwork.category))],
  regions: ["全部", ...new Set(artworks.map((artwork) => artwork.region))],
  periods: ["全部", ...new Set(artworks.map((artwork) => artwork.period))],
  materials: ["全部", ...new Set(artworks.map((artwork) => artwork.material))],
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

export function getRelatedArtworks(currentSlug: string, category: string) {
  return artworks
    .filter((artwork) => artwork.slug !== currentSlug && artwork.category === category)
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
      !filters.category || filters.category === "全部" || artwork.category === filters.category;
    const regionMatch =
      !filters.region || filters.region === "全部" || artwork.region === filters.region;
    const periodMatch =
      !filters.period || filters.period === "全部" || artwork.period === filters.period;
    const materialMatch =
      !filters.material || filters.material === "全部" || artwork.material === filters.material;

    return categoryMatch && regionMatch && periodMatch && materialMatch;
  });
}

export function getHighlightedArtworks(slugs: string[]) {
  return slugs
    .map((slug) => getArtworkBySlug(slug))
    .filter((artwork): artwork is Artwork => Boolean(artwork));
}
