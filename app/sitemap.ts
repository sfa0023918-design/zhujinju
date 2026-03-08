import type { MetadataRoute } from "next";

import { getPublicArticles, getPublicArtworks, getPublicExhibitions, loadSiteContent } from "@/lib/site-data";
import { resolveSiteBaseUrl } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await loadSiteContent();
  const baseUrl = resolveSiteBaseUrl(content.siteConfig);

  const staticRoutes = ["", "/collection", "/exhibitions", "/journal", "/about", "/contact"].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
    }),
  );

  const artworkRoutes = getPublicArtworks(content).map((artwork) => ({
    url: `${baseUrl}/collection/${artwork.slug}`,
    lastModified: new Date(),
  }));

  const exhibitionRoutes = getPublicExhibitions(content).map((exhibition) => ({
    url: `${baseUrl}/exhibitions/${exhibition.slug}`,
    lastModified: new Date(),
  }));

  const articleRoutes = getPublicArticles(content).map((article) => ({
    url: `${baseUrl}/journal/${article.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...artworkRoutes, ...exhibitionRoutes, ...articleRoutes];
}
