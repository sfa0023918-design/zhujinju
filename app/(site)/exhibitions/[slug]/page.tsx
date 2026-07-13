import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExhibitionDetailPageContent } from "@/components/exhibition-pages";
import { getAdminSession } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticlesBySlugs,
  getExhibitionBySlug,
  getHighlightedArtworks,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";

type ExhibitionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    preview?: string;
  }>;
};

export async function generateStaticParams() {
  const content = await loadSiteContent();

  return getPublicExhibitions(content).map((exhibition) => ({
    slug: exhibition.slug,
  }));
}

export async function generateMetadata({
  params,
  searchParams,
}: ExhibitionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const exhibition = getExhibitionBySlug(content, slug, { includeDrafts });

  if (!exhibition) {
    return buildMetadata({
      title: content.pageCopy.exhibitionDetail.errorTitle,
      description: content.pageCopy.exhibitionDetail.errorDescription,
      path: "/exhibitions",
      site: content.siteConfig,
    });
  }

  return buildMetadata({
    title: exhibition.title,
    description: exhibition.intro,
    path: `/exhibitions/${exhibition.slug}`,
    site: content.siteConfig,
  });
}

export default async function ExhibitionDetailPage({
  params,
  searchParams,
}: ExhibitionDetailPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const exhibition = getExhibitionBySlug(content, slug, { includeDrafts });

  if (!exhibition) {
    notFound();
  }

  return (
    <ExhibitionDetailPageContent
      exhibition={exhibition}
      detailCopy={content.pageCopy.exhibitionDetail}
      highlightedArtworks={getHighlightedArtworks(content, exhibition.highlightArtworkSlugs)}
      relatedArticles={getArticlesBySlugs(content, exhibition.relatedArticleSlugs)}
    />
  );
}
