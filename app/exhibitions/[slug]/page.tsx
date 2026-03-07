import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtworkCard } from "@/components/artwork-card";
import { buildMetadata } from "@/lib/metadata";
import { exhibitions, getExhibitionBySlug, getHighlightedArtworks } from "@/lib/site-data";

type ExhibitionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return exhibitions.map((exhibition) => ({
    slug: exhibition.slug,
  }));
}

export async function generateMetadata({
  params,
}: ExhibitionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const exhibition = getExhibitionBySlug(slug);

  if (!exhibition) {
    return buildMetadata({
      title: "展览未找到",
      description: "当前展览不存在或尚未公开。",
      path: "/exhibitions",
    });
  }

  return buildMetadata({
    title: exhibition.title,
    description: exhibition.intro,
    path: `/exhibitions/${exhibition.slug}`,
  });
}

export default async function ExhibitionDetailPage({
  params,
}: ExhibitionDetailPageProps) {
  const { slug } = await params;
  const exhibition = getExhibitionBySlug(slug);

  if (!exhibition) {
    notFound();
  }

  const highlightArtworks = getHighlightedArtworks(exhibition.highlightArtworkSlugs);

  return (
    <>
      <section className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 py-8 md:grid-cols-[minmax(0,1fr)_320px] md:px-10 md:py-12">
        <div className="space-y-6">
          <Link href="/exhibitions" className="inline-flex text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
            返回展览与图录
          </Link>
          <div className="space-y-4">
            <p className="text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
              {exhibition.subtitle}
            </p>
            <h1 className="max-w-5xl font-serif text-[2.8rem] leading-[0.94] tracking-[-0.05em] text-[var(--ink)] md:text-[5rem]">
              {exhibition.title}
            </h1>
            <p className="max-w-3xl text-sm leading-8 text-[var(--muted)] md:text-[0.98rem]">
              {exhibition.intro}
            </p>
          </div>
        </div>
        <div className="space-y-3 border-t border-[var(--line)] pt-5 text-sm leading-7 text-[var(--muted)] md:pt-0">
          <p>{exhibition.period}</p>
          <p>{exhibition.venue}</p>
          <p>{exhibition.catalogueTitle}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-14 md:px-10 md:pb-20">
        <div className="relative overflow-hidden bg-[var(--surface-strong)]">
          <Image
            src={exhibition.cover}
            alt={exhibition.title}
            width={1800}
            height={1100}
            priority
            unoptimized
            className="aspect-[1.65/1] h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,0.92fr)_minmax(0,0.8fr)] md:px-10 md:py-20">
        <div className="rich-text space-y-5 text-[0.98rem]">
          {exhibition.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="border-t border-[var(--line)] pt-5 text-sm leading-8 text-[var(--muted)] md:border-t-0 md:border-l md:pl-8 md:pt-0">
          <p className="mb-3 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
            图录说明
          </p>
          <p>{exhibition.catalogueIntro}</p>
          <p className="mt-4">
            图录页面当前以 mock 数据展示封面与简介，后续可扩展为 PDF 下载、图录目录与引用页码。
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
              重点作品
            </p>
            <h2 className="font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[3.5rem]">
              展览中的关键观看节点
            </h2>
          </div>
        </div>
        <div className="grid gap-8">
          {highlightArtworks.map((artwork) => (
            <ArtworkCard key={artwork.slug} artwork={artwork} />
          ))}
        </div>
      </section>
    </>
  );
}
