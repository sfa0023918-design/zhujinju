import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BilingualText } from "@/components/bilingual-text";
import { ArtworkCard } from "@/components/artwork-card";
import { bt } from "@/lib/bilingual";
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
      title: bt("展览未找到", "Exhibition Not Found"),
      description: bt("当前展览不存在或尚未公开。", "This exhibition is unavailable or not yet published."),
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
            返回展览与图录 / Back to Exhibitions
          </Link>
          <div className="space-y-4">
            <BilingualText
              as="p"
              text={exhibition.subtitle}
              className="flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.54rem] uppercase tracking-[0.24em]"
            />
            <BilingualText
              as="h1"
              text={exhibition.title}
              className="max-w-5xl font-serif text-[var(--ink)]"
              zhClassName="block text-[2.8rem] leading-[0.94] tracking-[-0.05em] md:text-[5rem]"
              enClassName="mt-3 block font-sans text-[0.84rem] uppercase tracking-[0.22em] text-[var(--accent)]"
            />
            <BilingualText
              as="p"
              text={exhibition.intro}
              className="max-w-3xl flex flex-col gap-3 text-[var(--muted)] md:text-[0.98rem]"
              zhClassName="text-sm leading-8"
              enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
            />
          </div>
        </div>
        <div className="space-y-4 border-t border-[var(--line)] pt-5 text-sm leading-7 text-[var(--muted)] md:pt-0">
          <BilingualText as="p" text={exhibition.period} className="flex flex-col gap-1" zhClassName="block" enClassName="block text-[0.72rem] text-[var(--accent)]/80" />
          <BilingualText as="p" text={exhibition.venue} className="flex flex-col gap-1" zhClassName="block" enClassName="block text-[0.72rem] text-[var(--accent)]/80" />
          <BilingualText as="p" text={exhibition.catalogueTitle} className="flex flex-col gap-1" zhClassName="block" enClassName="block text-[0.72rem] text-[var(--accent)]/80" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-14 md:px-10 md:pb-20">
        <div className="relative overflow-hidden bg-[var(--surface-strong)]">
          <Image
            src={exhibition.cover}
            alt={`${exhibition.title.zh} ${exhibition.title.en}`}
            width={1800}
            height={1100}
            priority
            unoptimized
            className="aspect-[1.65/1] h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,0.92fr)_minmax(0,0.8fr)] md:px-10 md:py-20">
        <div className="space-y-6">
          {exhibition.description.map((paragraph) => (
            <BilingualText
              key={paragraph.zh}
              as="p"
              text={paragraph}
              className="flex flex-col gap-3 text-[var(--muted)]"
              zhClassName="text-[0.98rem] leading-8"
              enClassName="text-[0.82rem] leading-7 text-[var(--accent)]/80"
            />
          ))}
        </div>
        <div className="border-t border-[var(--line)] pt-5 text-sm leading-8 text-[var(--muted)] md:border-t-0 md:border-l md:pl-8 md:pt-0">
          <BilingualText
            as="p"
            text={bt("图录说明", "Catalogue Note")}
            className="mb-4 flex flex-col gap-1 text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.22em]"
            enClassName="text-[0.54rem] uppercase tracking-[0.24em]"
          />
          <BilingualText
            as="p"
            text={exhibition.catalogueIntro}
            className="flex flex-col gap-3"
            zhClassName="text-sm leading-8"
            enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
          />
          <BilingualText
            as="p"
            text={bt(
              "图录页面当前以 mock 数据展示封面与简介，后续可扩展为 PDF 下载、图录目录与引用页码。",
              "The catalogue section currently uses mock content and can later expand to include PDF downloads, full contents, and referenced page numbers."
            )}
            className="mt-4 flex flex-col gap-3"
            zhClassName="text-sm leading-8"
            enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <BilingualText
              as="p"
              text={bt("重点作品", "Highlighted Works")}
              className="mb-3 flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.54rem] uppercase tracking-[0.24em]"
            />
            <BilingualText
              as="h2"
              text={bt("展览中的关键观看节点", "Key Viewing Points Within the Exhibition")}
              className="font-serif text-[var(--ink)]"
              zhClassName="block text-[2rem] leading-none tracking-[-0.04em] md:text-[3.5rem]"
              enClassName="mt-3 block font-sans text-[0.82rem] uppercase tracking-[0.22em] text-[var(--accent)]"
            />
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
