import type { Metadata } from "next";

import { getExhibitionDetailMetadata, renderExhibitionDetail } from "../detail";

export const dynamic = "force-dynamic";

type ExhibitionPreviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ExhibitionPreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const metadata = await getExhibitionDetailMetadata(slug, { allowDraftPreview: true });
  return {
    ...metadata,
    robots: { index: false, follow: false },
  };
}

export default async function ExhibitionPreviewPage({
  params,
}: ExhibitionPreviewPageProps) {
  const { slug } = await params;
  return renderExhibitionDetail(slug, { allowDraftPreview: true });
}
