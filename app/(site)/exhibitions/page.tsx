import { V3FlagshipExhibition } from "@/components/v3/v3-exhibitions";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import {
  getPublicArtworks,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";
import { countExhibitionWorks, sortExhibitionsNewest } from "@/lib/v3-helpers";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("展览与图录", "Exhibitions & Catalogues"),
    description: pageCopy.exhibitions.hero.description,
    path: "/exhibitions",
    site: siteConfig,
  });
}

export default async function ExhibitionsPage() {
  const content = await loadSiteContent();
  const sorted = sortExhibitionsNewest(getPublicExhibitions(content));
  const featured = sorted.find((item) => item.current) ?? sorted[0];

  if (!featured) {
    return null;
  }

  const artworks = getPublicArtworks(content);
  const past = sorted.filter((item) => item.slug !== featured.slug);

  return (
    <V3FlagshipExhibition
      exhibition={featured}
      pastExhibitions={past}
      allExhibitions={sorted}
      worksCount={countExhibitionWorks(featured, artworks)}
    />
  );
}
