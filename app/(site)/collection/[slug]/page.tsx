import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArtworkDetailTemplate } from "@/components/artwork-detail-template";
import { getAdminSession } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticlesBySlugs,
  getArtworkBySlug,
  getExhibitionsBySlugs,
  getRelatedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

type ArtworkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    preview?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
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
  });
}

export default async function ArtworkDetailPage({ params, searchParams }: ArtworkDetailPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const artwork = getArtworkBySlug(content, slug, { includeDrafts });

  if (!artwork) {
    notFound();
  }

  const relatedWorks = getRelatedArtworks(content, artwork.slug, artwork.category.zh);
  const relatedArticles = getArticlesBySlugs(content, artwork.relatedArticleSlugs);
  const relatedExhibitions = getExhibitionsBySlugs(content, artwork.relatedExhibitionSlugs);

  return (
    <ArtworkDetailTemplate
      artwork={artwork}
      detailCopy={content.pageCopy.artworkDetail}
      siteConfig={content.siteConfig}
      relatedWorks={relatedWorks}
      relatedArticles={relatedArticles}
      relatedExhibitions={relatedExhibitions}
    />
  );
}
