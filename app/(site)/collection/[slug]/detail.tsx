import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { V3ArtworkDetail } from "@/components/v3/v3-artwork-detail";
import { getAdminSession } from "@/lib/admin-auth";
import { getArtworkCatalogueReference } from "@/lib/data/catalogue-pages";
import { resolveArtworkPrimaryImage } from "@/lib/image-url";
import { buildMetadata } from "@/lib/metadata";
import {
  getArtworkBySlug,
  getPublicArtworks,
  loadSiteContent,
} from "@/lib/site-data";
import { getV3CategoryKey } from "@/lib/v3-helpers";

export async function getArtworkDetailMetadata(
  slug: string,
  options?: { allowDraftPreview?: boolean },
): Promise<Metadata> {
  const content = await loadSiteContent();
  const includeDrafts = options?.allowDraftPreview
    ? Boolean(await getAdminSession())
    : false;
  const artwork = getArtworkBySlug(content, slug, { includeDrafts });

  if (!artwork) {
    return buildMetadata({
      title: content.pageCopy.artworkDetail.errorTitle,
      description: content.pageCopy.artworkDetail.errorDescription,
      path: "/collection",
      site: content.siteConfig,
    });
  }

  return buildMetadata({
    title: artwork.title,
    description: artwork.excerpt,
    path: `/collection/${artwork.slug}`,
    site: content.siteConfig,
    image: { path: resolveArtworkPrimaryImage(artwork), alt: artwork.title },
  });
}

export async function renderArtworkDetail(
  slug: string,
  options?: { allowDraftPreview?: boolean },
) {
  const content = await loadSiteContent();
  const includeDrafts = options?.allowDraftPreview
    ? Boolean(await getAdminSession())
    : false;
  const artwork = getArtworkBySlug(content, slug, { includeDrafts });

  if (!artwork) {
    notFound();
  }

  const publicArtworks = getPublicArtworks(content);
  const foundIndex = publicArtworks.findIndex((item) => item.slug === artwork.slug);
  const index = foundIndex >= 0 ? foundIndex : 0;
  const total = publicArtworks.length || 1;
  const prevArtwork =
    publicArtworks[(index - 1 + total) % total] ?? artwork;
  const nextArtwork =
    publicArtworks[(index + 1) % total] ?? artwork;

  const targetCat = getV3CategoryKey(artwork);
  const relatedWorks = publicArtworks
    .filter((item) => item.slug !== artwork.slug)
    .map((item) => ({
      item,
      score:
        (item.region?.zh === artwork.region?.zh ? 3 : 0) +
        (getV3CategoryKey(item) === targetCat ? 2 : 0) +
        (item.period?.zh === artwork.period?.zh ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => entry.item);

  const catalogue = getArtworkCatalogueReference(artwork, content.exhibitions);

  return (
    <V3ArtworkDetail
      artwork={artwork}
      index={index}
      total={total}
      prevArtwork={prevArtwork}
      nextArtwork={nextArtwork}
      relatedWorks={relatedWorks}
      catalogue={catalogue}
    />
  );
}
