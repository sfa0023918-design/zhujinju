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
  // A page's own picture for link previews (artwork, article cover, exhibition cover).
  image?: { path?: string | null; alt: string | BilingualText };
};

function getShareImage(image: MetadataOptions["image"], site: SiteConfigContent) {
  const path = image?.path?.trim();

  if (!image || !path || !path.startsWith("/uploads/")) {
    return null;
  }

  // Served through the image optimiser at 1200 px so previews stay light.
  return {
    url: absoluteUrl(`/_next/image?url=${encodeURIComponent(path)}&w=1200&q=75`, site),
    alt: formatMetadataText(image.alt),
  };
}

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  type = "website",
  site = siteConfig,
  image,
}: MetadataOptions = {}): Metadata {
  const shareImage = getShareImage(image, site);
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
        {
          url: "/favicon-32x32.png?v=20260317",
          sizes: "32x32",
          type: "image/png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/favicon-16x16.png?v=20260317",
          sizes: "16x16",
          type: "image/png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/favicon-dark-32x32.png?v=20260317",
          sizes: "32x32",
          type: "image/png",
          media: "(prefers-color-scheme: dark)",
        },
        {
          url: "/favicon-dark-16x16.png?v=20260317",
          sizes: "16x16",
          type: "image/png",
          media: "(prefers-color-scheme: dark)",
        },
        { url: "/favicon.ico?v=20260317", rel: "shortcut icon" },
      ],
      shortcut: ["/favicon.ico?v=20260317"],
      apple: [{ url: "/apple-touch-icon.png?v=20260317", sizes: "180x180", type: "image/png" }],
      other: [{ rel: "manifest", url: "/site.webmanifest" }],
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
      images: shareImage
        ? [shareImage]
        : [
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
      images: [shareImage?.url ?? absoluteUrl(site.ogImagePath, site)],
    },
  };
}
