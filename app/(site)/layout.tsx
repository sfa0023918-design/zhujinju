import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";

import { SiteFontPreloads } from "@/components/site-font-preloads";
import { V3Shell } from "@/components/v3/v3-shell";
import { resolveArticleCover } from "@/lib/article-content";
import { getPublicArticles, getPublicArtworks, loadSiteContent } from "@/lib/site-data";
import { buildSearchIndex } from "@/lib/v3-helpers";

import "./reading-critical-fonts.css";
import "./reading-ui-fonts.css";
import "./v3-redesign.css";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await loadSiteContent();
  const publicArtworks = getPublicArtworks(content);
  const publicArticles = getPublicArticles(content);
  const searchIndex = buildSearchIndex(publicArtworks, publicArticles, resolveArticleCover);

  return (
    <Suspense fallback={null}>
      <SiteFontPreloads />
      <V3Shell searchIndex={searchIndex} contact={content.siteConfig.contact}>
        {children}
      </V3Shell>
      <Analytics />
    </Suspense>
  );
}
