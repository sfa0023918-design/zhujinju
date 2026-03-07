import type { Metadata } from "next";

import { formatMetadataText } from "./bilingual";
import type { BilingualText } from "./data/types";
import { absoluteUrl, resolveSiteBaseUrl, siteConfig } from "./site-config";
import type { SiteConfigContent } from "./data/types";

type MetadataOptions = {
  title?: string | BilingualText;
  description?: string | BilingualText;
  path?: string;
  type?: "website" | "article";
  site?: SiteConfigContent;
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  type = "website",
  site = siteConfig,
}: MetadataOptions = {}): Metadata {
  const fullTitle = title
    ? `${formatMetadataText(title)} | ${formatMetadataText(site.siteName)}`
    : formatMetadataText(site.title);
  const resolvedDescription = formatMetadataText(description);
  const canonical = path === "/" ? "/" : path;

  return {
    metadataBase: new URL(resolveSiteBaseUrl(site)),
    title: fullTitle,
    description: resolvedDescription,
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", rel: "shortcut icon" },
      ],
      shortcut: ["/favicon.ico"],
    },
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description: resolvedDescription,
      locale: site.locale,
      type,
      url: absoluteUrl(path, site),
      siteName: formatMetadataText(site.siteName),
      images: [
        {
          url: absoluteUrl(site.ogImagePath, site),
          width: 1200,
          height: 630,
          alt: formatMetadataText(site.siteName),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: resolvedDescription,
      images: [absoluteUrl(site.ogImagePath, site)],
    },
  };
}
