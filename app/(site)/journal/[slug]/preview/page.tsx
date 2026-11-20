import type { Metadata } from "next";

import { getArticleDetailMetadata, renderArticleDetail } from "../detail";

export const dynamic = "force-dynamic";

type ArticlePreviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ArticlePreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const metadata = await getArticleDetailMetadata(slug, { allowDraftPreview: true });
  return {
    ...metadata,
    robots: { index: false, follow: false },
  };
}

export default async function ArticlePreviewPage({
  params,
}: ArticlePreviewPageProps) {
  const { slug } = await params;
  return renderArticleDetail(slug, { allowDraftPreview: true });
}
