import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExhibitionDetailPageContent } from "@/components/exhibition-pages";
import { getAdminSession } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/metadata";
import type { BilingualText, Exhibition } from "@/lib/site-data";
import {
  getArticlesBySlugs,
  getExhibitionBySlug,
  getHighlightedArtworks,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";

function summarize(text: string, maxLength: number, joinWith: string) {
  const flat = text.split(/\s+/).filter(Boolean).join(joinWith).trim();
  return flat.length > maxLength ? `${flat.slice(0, maxLength).trimEnd()}…` : flat;
}

// The intro field of some exhibitions holds only the heading "序 / Preface", which
// makes a poor link preview; use the opening of the preface instead.
function getExhibitionShareDescription(exhibition: Exhibition): BilingualText {
  const opening = exhibition.description[0];

  if (exhibition.intro.zh.trim().length > 4 || !opening) {
    return exhibition.intro;
  }

  return { zh: summarize(opening.zh, 90, ""), en: summarize(opening.en, 180, " ") };
}

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
    description: getExhibitionShareDescription(exhibition),
    path: `/exhibitions/${exhibition.slug}`,
    site: content.siteConfig,
    image: { path: exhibition.cover || exhibition.coverAsset?.original, alt: exhibition.title },
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
