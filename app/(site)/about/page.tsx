import { V3AboutPage } from "@/components/v3/v3-institutional";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import {
  getPublicArticles,
  getPublicArtworks,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";

export async function generateMetadata() {
  const { siteConfig } = await loadSiteContent();

  return buildMetadata({
    title: bt("关于", "About"),
    description: siteConfig.about.body[0],
    path: "/about",
    site: siteConfig,
  });
}

export default async function AboutPage() {
  const content = await loadSiteContent();
  const artworks = getPublicArtworks(content);
  const exhibitions = getPublicExhibitions(content);
  const articles = getPublicArticles(content);

  return (
    <V3AboutPage
      siteConfig={content.siteConfig}
      brandIntro={content.brandIntro}
      collectingDirections={content.collectingDirections}
      artworks={artworks}
      exhibitionsCount={exhibitions.length}
      articlesCount={articles.length}
    />
  );
}
