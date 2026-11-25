import { Suspense } from "react";

import { V3ContactPage } from "@/components/v3/v3-institutional";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getPublicArtworks, loadSiteContent } from "@/lib/site-data";

export async function generateMetadata() {
  const { siteConfig } = await loadSiteContent();

  return buildMetadata({
    title: bt("联系", "Contact"),
    description: siteConfig.contactPage.description,
    path: "/contact",
    site: siteConfig,
  });
}

export default async function ContactPage() {
  const content = await loadSiteContent();
  const artworks = getPublicArtworks(content);

  return (
    <Suspense fallback={null}>
      <V3ContactPage siteConfig={content.siteConfig} artworks={artworks} />
    </Suspense>
  );
}
