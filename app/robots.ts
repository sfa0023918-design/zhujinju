import type { MetadataRoute } from "next";

import { loadSiteContent } from "@/lib/site-data";
import { absoluteUrl } from "@/lib/site-config";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteConfig } = await loadSiteContent();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml", siteConfig),
  };
}
