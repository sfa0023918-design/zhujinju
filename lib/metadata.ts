import type { Metadata } from "next";

import { absoluteUrl, siteBaseUrl, siteConfig } from "./site-config";

type MetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  type = "website",
}: MetadataOptions = {}): Metadata {
  const fullTitle = title ? `${title} | ${siteConfig.siteName}` : siteConfig.title;
  const canonical = path === "/" ? "/" : path;

  return {
    metadataBase: new URL(siteBaseUrl),
    title: fullTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description,
      locale: siteConfig.locale,
      type,
      url: absoluteUrl(path),
      siteName: siteConfig.siteName,
      images: [
        {
          url: absoluteUrl(siteConfig.ogImagePath),
          width: 1200,
          height: 630,
          alt: siteConfig.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [absoluteUrl(siteConfig.ogImagePath)],
    },
  };
}
