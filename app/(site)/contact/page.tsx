import { ContactPageContent } from "@/components/institutional-pages";
import { getInquiryCatalogItem } from "@/lib/artwork-inquiry";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getPublicArtworks, loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-static";

export async function generateMetadata() {
  const { siteConfig } = await loadSiteContent();

  return buildMetadata({
    title: bt("联系", "Contact"),
    description: siteConfig.contactPage.description,
    path: "/contact",
    site: siteConfig,
  });
}

export default async function ContactPage() {
  const content = await loadSiteContent();
  const inquiryWorks = getPublicArtworks(content)
    .filter((artwork) => artwork.status !== "sold")
    .map(getInquiryCatalogItem);

  return (
    <ContactPageContent
      siteConfig={content.siteConfig}
      pageCopy={content.pageCopy}
      inquiryWorks={inquiryWorks}
    />
  );
}
