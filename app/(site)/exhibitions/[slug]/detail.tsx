import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { V3FlagshipExhibition, V3PastExhibition } from "@/components/v3/v3-exhibitions";
import { getAdminSession } from "@/lib/admin-auth";
import { getExhibitionMetadataTitle } from "@/lib/display-format";
import { buildMetadata } from "@/lib/metadata";
import type { BilingualText, Exhibition } from "@/lib/site-data";
import {
  getExhibitionBySlug,
  getPublicArtworks,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";
import {
  countExhibitionWorks,
  isFlagshipExhibition,
  sortExhibitionsNewest,
} from "@/lib/v3-helpers";

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

export async function getExhibitionDetailMetadata(
  slug: string,
  options?: { allowDraftPreview?: boolean },
): Promise<Metadata> {
  const content = await loadSiteContent();
  const includeDrafts = options?.allowDraftPreview
    ? Boolean(await getAdminSession())
    : false;
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

export async function renderExhibitionDetail(
  slug: string,
  options?: { allowDraftPreview?: boolean },
) {
  const content = await loadSiteContent();
  const includeDrafts = options?.allowDraftPreview
    ? Boolean(await getAdminSession())
    : false;
  const exhibition = getExhibitionBySlug(content, slug, { includeDrafts });

  if (!exhibition) {
    notFound();
  }

  const allExhibitions = sortExhibitionsNewest(getPublicExhibitions(content));
  const others = allExhibitions.filter((item) => item.slug !== exhibition.slug);

  if (isFlagshipExhibition(exhibition, allExhibitions)) {
    const artworks = getPublicArtworks(content);
    return (
      <V3FlagshipExhibition
        exhibition={exhibition}
        pastExhibitions={others}
        allExhibitions={allExhibitions}
        worksCount={countExhibitionWorks(exhibition, artworks)}
      />
    );
  }

  return (
    <V3PastExhibition
      exhibition={exhibition}
      otherExhibitions={others}
      allExhibitions={allExhibitions}
    />
  );
}
