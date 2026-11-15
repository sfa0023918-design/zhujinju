import { ExhibitionsPageContent } from "@/components/exhibition-pages";
import { ContemporaryExhibition } from "@/components/contemporary-exhibition";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticlesBySlugs,
  getHighlightedArtworks,
  getPublicArticles,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";

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
  const exhibitions = getPublicExhibitions(content);
  const featured = exhibitions.find((item) => item.current) ?? exhibitions[0];

  if (featured) {
    const relatedArticles = Array.from(new Map([
      ...getArticlesBySlugs(content, featured.relatedArticleSlugs),
      ...getPublicArticles(content).filter((item) => item.relatedExhibitionSlugs.includes(featured.slug)),
    ].map((item) => [item.slug, item])).values());

    return (
      <ContemporaryExhibition
        exhibition={featured}
        detailCopy={content.pageCopy.exhibitionDetail}
        relatedArticles={relatedArticles}
        pastExhibitions={exhibitions.filter((item) => item.slug !== featured.slug)}
        fallbackWorkCount={getHighlightedArtworks(content, featured.highlightArtworkSlugs).length}
        showBackLink={false}
      />
    );
  }

  return (
    <ExhibitionsPageContent
      exhibitions={exhibitions}
      pageCopy={content.pageCopy}
    />
  );
}
