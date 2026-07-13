import { AboutPageContent } from "@/components/institutional-pages";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getOperationalFacts, loadSiteContent } from "@/lib/site-data";

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

  return (
    <AboutPageContent
      siteConfig={content.siteConfig}
      pageCopy={content.pageCopy}
      operationalFacts={getOperationalFacts(content)}
    />
  );
}
