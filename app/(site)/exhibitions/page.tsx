import { ExhibitionsPageContent } from "@/components/exhibition-pages";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getPublicExhibitions, loadSiteContent } from "@/lib/site-data";

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

  return (
    <ExhibitionsPageContent
      exhibitions={getPublicExhibitions(content)}
      pageCopy={content.pageCopy}
    />
  );
}
