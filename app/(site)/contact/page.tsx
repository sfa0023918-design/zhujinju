import { ContactPageContent } from "@/components/institutional-pages";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { loadSiteContent } from "@/lib/site-data";

type ContactPageProps = {
  searchParams?: Promise<{
    artwork?: string;
  }>;
};

export async function generateMetadata() {
  const { siteConfig } = await loadSiteContent();

  return buildMetadata({
    title: bt("联系", "Contact"),
    description: siteConfig.contactPage.description,
    path: "/contact",
    site: siteConfig,
  });
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = (await searchParams) ?? {};
  const content = await loadSiteContent();

  return (
    <ContactPageContent
      siteConfig={content.siteConfig}
      pageCopy={content.pageCopy}
      initialArtwork={params.artwork}
    />
  );
}
