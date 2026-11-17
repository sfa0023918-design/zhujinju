import type { MetadataRoute } from "next";

import { getPublicArticles, getPublicArtworks, getPublicExhibitions, loadSiteContent } from "@/lib/site-data";
import { resolveSiteBaseUrl } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await loadSiteContent();
  const baseUrl = resolveSiteBaseUrl(content.siteConfig);

  // Content has no reliable per-record update timestamp. Omit lastmod rather
  // than telling crawlers every request represents an editorial update.
  const staticRoutes = ["", "/collection", "/exhibitions", "/journal", "/about", "/contact"].map(
    (path) => ({
      url: `${baseUrl}${path}`,
    }),
  );

  const artworkRoutes = getPublicArtworks(content).map((artwork) => ({
    url: `${baseUrl}/collection/${artwork.slug}`,
  }));

  const exhibitionRoutes = getPublicExhibitions(content).map((exhibition) => ({
    url: `${baseUrl}/exhibitions/${exhibition.slug}`,
  }));

  const articleRoutes = getPublicArticles(content).map((article) => ({
    url: `${baseUrl}/journal/${article.slug}`,
  }));

  return [...staticRoutes, ...artworkRoutes, ...exhibitionRoutes, ...articleRoutes];
}
