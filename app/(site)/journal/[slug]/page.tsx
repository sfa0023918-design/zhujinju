import type { Metadata } from "next";

import { getPublicArticles, loadSiteContent } from "@/lib/site-data";

import { getArticleDetailMetadata, renderArticleDetail } from "./detail";

type ArticleDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const content = await loadSiteContent();

  return getPublicArticles(content).map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return getArticleDetailMetadata(slug);
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const { slug } = await params;
  return renderArticleDetail(slug);
}
