import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArtworkCatalogueReference } from "@/lib/data/catalogue-pages";
import { ArtworkDetailTemplate } from "@/components/artwork-detail-template";
import { resolveArtworkPrimaryImage } from "@/lib/image-url";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticlesBySlugs,
  getArtworkBySlug,
  getExhibitionsBySlugs,
  getRelatedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

export async function detailMetadata(slug: string, includeDrafts = false): Promise<Metadata> {
  const content = await loadSiteContent();
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

export async function renderDetail(slug: string, includeDrafts = false) {
  const content = await loadSiteContent();
  const artwork = getArtworkBySlug(content, slug, { includeDrafts });

  if (!artwork) {
    notFound();
  }

  const relatedWorks = getRelatedArtworks(
    content,
    artwork.slug,
    artwork.category.zh,
  );
  const relatedArticles = getArticlesBySlugs(
    content,
    artwork.relatedArticleSlugs,
  );
  const relatedExhibitions = getExhibitionsBySlugs(
    content,
    artwork.relatedExhibitionSlugs,
  );

  const catalogue = getArtworkCatalogueReference(artwork, content.exhibitions);

  return (
    <ArtworkDetailTemplate
      catalogue={catalogue}
      artwork={artwork}
      detailCopy={content.pageCopy.artworkDetail}
      relatedWorks={relatedWorks}
      relatedArticles={relatedArticles}
      relatedExhibitions={relatedExhibitions}
    />
  );
}
