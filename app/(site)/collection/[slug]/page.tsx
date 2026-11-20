import type { Metadata } from "next";

import { getPublicArtworks, loadSiteContent } from "@/lib/site-data";

import { getArtworkDetailMetadata, renderArtworkDetail } from "./detail";

type ArtworkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const content = await loadSiteContent();

  return getPublicArtworks(content).map((artwork) => ({
    slug: artwork.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return getArtworkDetailMetadata(slug);
}

export default async function ArtworkDetailPage({
  params,
}: ArtworkDetailPageProps) {
  const { slug } = await params;
  return renderArtworkDetail(slug);
}
