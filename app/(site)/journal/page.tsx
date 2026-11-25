import { V3JournalIndex } from "@/components/v3/v3-journal";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getPublicArticles, loadSiteContent } from "@/lib/site-data";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("文章与动态", "Journal"),
    description: pageCopy.journal.hero.description,
    path: "/journal",
    site: siteConfig,
  });
}

export default async function JournalPage() {
  const content = await loadSiteContent();
  const articles = getPublicArticles(content);

  return <V3JournalIndex articles={articles} />;
}
