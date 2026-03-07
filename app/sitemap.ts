import type { MetadataRoute } from "next";

import { articles, artworks, exhibitions } from "@/lib/site-data";
import { siteBaseUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteBaseUrl;

  const staticRoutes = ["", "/collection", "/exhibitions", "/journal", "/about", "/contact"].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
    }),
  );

  const artworkRoutes = artworks.map((artwork) => ({
    url: `${baseUrl}/collection/${artwork.slug}`,
    lastModified: new Date(),
  }));

  const exhibitionRoutes = exhibitions.map((exhibition) => ({
    url: `${baseUrl}/exhibitions/${exhibition.slug}`,
    lastModified: new Date(),
  }));

  const articleRoutes = articles.map((article) => ({
    url: `${baseUrl}/journal/${article.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...artworkRoutes, ...exhibitionRoutes, ...articleRoutes];
}
