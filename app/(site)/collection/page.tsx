import { Suspense } from "react";

import { V3Collection } from "@/components/v3/v3-collection";
import { bt } from "@/lib/bilingual";
import { toCollectionArtworkSummary } from "@/lib/collection-filtering";
import { buildMetadata } from "@/lib/metadata";
import { getPublicArtworks, loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-static";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();
  return buildMetadata({
    title: bt("藏品", "Collection"),
    description: pageCopy.collection.hero.description,
    path: "/collection",
    site: siteConfig,
  });
}

export default async function CollectionPage() {
  const content = await loadSiteContent();
  const artworkSummaries = getPublicArtworks(content).map(toCollectionArtworkSummary);

  return (
    <Suspense fallback={null}>
      <V3Collection artworks={artworkSummaries} />
    </Suspense>
  );
}
