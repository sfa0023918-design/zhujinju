import type { Metadata } from "next";

import { getArtworkDetailMetadata, renderArtworkDetail } from "../detail";

export const dynamic = "force-dynamic";

type ArtworkPreviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ArtworkPreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const metadata = await getArtworkDetailMetadata(slug, { allowDraftPreview: true });
  return {
    ...metadata,
    robots: { index: false, follow: false },
  };
}

export default async function ArtworkPreviewPage({
  params,
}: ArtworkPreviewPageProps) {
  const { slug } = await params;
  return renderArtworkDetail(slug, { allowDraftPreview: true });
}
