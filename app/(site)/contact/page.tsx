import { ContactPageContent } from "@/components/institutional-pages";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getInquiryRequest, getInquiryWork } from "@/lib/artwork-inquiry";
import { getArtworkBySlug, loadSiteContent } from "@/lib/site-data";

type ContactPageProps = {
  searchParams?: Promise<{
    artwork?: string | string[];
    work?: string | string[];
    request?: string | string[];
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
  const [params, content] = await Promise.all([searchParams, loadSiteContent()]);
  const work = typeof params?.work === "string" ? getArtworkBySlug(content, params.work) : undefined;
  const artwork = work?.status === "sold" ? undefined : work;
  const legacyTitle = typeof params?.artwork === "string" ? params.artwork.slice(0, 200) : "";
  const request = typeof params?.request === "string" ? params.request.slice(0, 200) : "";
  const selectedRequest = artwork ? getInquiryRequest(artwork, request)
    : legacyTitle && request ? { zh: request, en: "" } : undefined;

  return (
    <ContactPageContent
      siteConfig={content.siteConfig}
      pageCopy={content.pageCopy}
      initialArtwork={legacyTitle}
      work={artwork ? getInquiryWork(artwork) : undefined}
      request={selectedRequest}
    />
  );
}
