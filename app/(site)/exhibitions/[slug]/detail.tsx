import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExhibitionDetailPageContent } from "@/components/exhibition-pages";
import { getExhibitionMetadataTitle } from "@/lib/display-format";
import { buildMetadata } from "@/lib/metadata";
import type { BilingualText, Exhibition } from "@/lib/site-data";
import {
  getArticlesBySlugs,
  getPublicArticles,
  getExhibitionBySlug,
  getHighlightedArtworks,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";

function summarize(text: string, maxLength: number, joinWith: string) {
  const flat = text.split(/\s+/).filter(Boolean).join(joinWith).trim();
  return flat.length > maxLength
    ? `${flat.slice(0, maxLength).trimEnd()}…`
    : flat;
}

// The intro field of some exhibitions holds only the heading "序 / Preface", which
// makes a poor link preview; use the opening of the preface instead.
function getExhibitionShareDescription(exhibition: Exhibition): BilingualText {
  const opening = exhibition.description[0];

  if (exhibition.intro.zh.trim().length > 4 || !opening) {
    return exhibition.intro;
  }

  return {
    zh: summarize(opening.zh, 90, ""),
    en: summarize(opening.en, 180, " "),
  };
}

export async function detailMetadata(slug: string, includeDrafts = false): Promise<Metadata> {
  const content = await loadSiteContent();
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
    title: getExhibitionMetadataTitle(exhibition.title),
    description: getExhibitionShareDescription(exhibition),
    path: `/exhibitions/${exhibition.slug}`,
    site: content.siteConfig,
    image: {
      path: exhibition.cover || exhibition.coverAsset?.original,
      alt: exhibition.title,
    },
  });
}

export async function renderDetail(slug: string, includeDrafts = false) {
  const content = await loadSiteContent();
  const exhibition = getExhibitionBySlug(content, slug, { includeDrafts });

  if (!exhibition) {
    notFound();
  }

  return (
    <ExhibitionDetailPageContent
      exhibition={exhibition}
      detailCopy={content.pageCopy.exhibitionDetail}
      highlightedArtworks={getHighlightedArtworks(
        content,
        exhibition.highlightArtworkSlugs,
      )}
      relatedArticles={Array.from(
        new Map(
          [
            ...getArticlesBySlugs(content, exhibition.relatedArticleSlugs),
            ...getPublicArticles(content).filter((article) =>
              article.relatedExhibitionSlugs.includes(exhibition.slug),
            ),
          ].map((article) => [article.slug, article]),
        ).values(),
      )}
      pastExhibitions={getPublicExhibitions(content)
        .filter((item) => item.slug !== exhibition.slug)
        .sort((a, b) => b.period.zh.localeCompare(a.period.zh))}
    />
  );
}
