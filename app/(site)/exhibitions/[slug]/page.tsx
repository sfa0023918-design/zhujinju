import type { Metadata } from "next";

import { getPublicExhibitions, loadSiteContent } from "@/lib/site-data";

import { getExhibitionDetailMetadata, renderExhibitionDetail } from "./detail";

type ExhibitionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const content = await loadSiteContent();

  return getPublicExhibitions(content).map((exhibition) => ({
    slug: exhibition.slug,
  }));
}

export async function generateMetadata({
  params,
}: ExhibitionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return getExhibitionDetailMetadata(slug);
}

export default async function ExhibitionDetailPage({
  params,
}: ExhibitionDetailPageProps) {
  const { slug } = await params;
  return renderExhibitionDetail(slug);
}
