import type { Metadata } from "next";

import { formatMetadataText } from "./bilingual";
import type { BilingualText } from "./data/types";
import { absoluteUrl, siteBaseUrl, siteConfig } from "./site-config";

type MetadataOptions = {
  title?: string | BilingualText;
  description?: string | BilingualText;
  path?: string;
  type?: "website" | "article";
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  type = "website",
}: MetadataOptions = {}): Metadata {
  const fullTitle = title
    ? `${formatMetadataText(title)} | ${formatMetadataText(siteConfig.siteName)}`
    : formatMetadataText(siteConfig.title);
  const resolvedDescription = formatMetadataText(description);
  const canonical = path === "/" ? "/" : path;

  return {
    metadataBase: new URL(siteBaseUrl),
    title: fullTitle,
    description: resolvedDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description: resolvedDescription,
      locale: siteConfig.locale,
      type,
      url: absoluteUrl(path),
      siteName: formatMetadataText(siteConfig.siteName),
      images: [
        {
          url: absoluteUrl(siteConfig.ogImagePath),
          width: 1200,
          height: 630,
          alt: formatMetadataText(siteConfig.siteName),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: resolvedDescription,
      images: [absoluteUrl(siteConfig.ogImagePath)],
    },
  };
}
