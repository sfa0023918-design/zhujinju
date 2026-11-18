import { getPublicArtworks, loadSiteContent } from "@/lib/site-data";
import { detailMetadata, renderDetail } from "./detail";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const content = await loadSiteContent();

  return getPublicArtworks(content).map((artwork) => ({
    slug: artwork.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  return detailMetadata((await params).slug);
}

export default async function Page({ params }: Props) {
  return renderDetail((await params).slug);
}
