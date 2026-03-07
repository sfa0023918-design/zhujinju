import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtworkCard } from "@/components/artwork-card";
import { StatusPill } from "@/components/status-pill";
import { buildMetadata } from "@/lib/metadata";
import { artworks, getArtworkBySlug, getRelatedArtworks } from "@/lib/site-data";

type ArtworkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return artworks.map((artwork) => ({
    slug: artwork.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artwork = getArtworkBySlug(slug);

  if (!artwork) {
    return buildMetadata({
      title: "作品未找到",
      description: "当前作品不存在或尚未公开。",
      path: "/collection",
    });
  }

  return buildMetadata({
    title: artwork.title,
    description: artwork.excerpt,
    path: `/collection/${artwork.slug}`,
  });
}

const fieldRows = [
  { label: "年代", key: "period" },
  { label: "地区 / 产地", key: "region" },
  { label: "材质", key: "material" },
  { label: "尺寸", key: "dimensions" },
] as const;

export default async function ArtworkDetailPage({ params }: ArtworkDetailPageProps) {
  const { slug } = await params;
  const artwork = getArtworkBySlug(slug);

  if (!artwork) {
    notFound();
  }

  const related = getRelatedArtworks(artwork.slug, artwork.category);

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 py-8 md:px-10 md:py-12">
        <div className="mb-8 text-sm text-[var(--muted)]">
          <Link href="/collection" className="transition-colors hover:text-[var(--ink)]">
            藏品
          </Link>
          <span className="px-2">/</span>
          <span>{artwork.title}</span>
        </div>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.02fr)_minmax(280px,0.5fr)] md:gap-12">
          <div className="relative overflow-hidden bg-[var(--surface-strong)]">
            <Image
              src={artwork.image}
              alt={artwork.title}
              width={1200}
              height={1500}
              priority
              unoptimized
              className="aspect-[4/5] h-full w-full object-cover"
            />
          </div>
          <aside className="space-y-8 md:sticky md:top-8 md:self-start">
            <div className="space-y-5 border-t border-[var(--line)] pt-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
                  {artwork.category}
                </p>
                <StatusPill status={artwork.status} />
              </div>
              <div>
                <h1 className="font-serif text-[2.5rem] leading-[0.96] tracking-[-0.05em] text-[var(--ink)] md:text-[4.35rem]">
                  {artwork.title}
                </h1>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)] md:text-[0.98rem]">
                  {artwork.subtitle}
                </p>
              </div>
              <p className="text-sm leading-8 text-[var(--muted)]">{artwork.excerpt}</p>
            </div>

            <dl className="grid gap-4 border-t border-[var(--line)] pt-5 text-sm">
              {fieldRows.map((field) => (
                <div key={field.key} className="grid grid-cols-[112px_1fr] gap-4">
                  <dt className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)] uppercase">
                    {field.label}
                  </dt>
                  <dd className="text-[var(--muted)]">{artwork[field.key]}</dd>
                </div>
              ))}
            </dl>

            <div className="grid gap-3 border-t border-[var(--line)] pt-5">
              <Link
                href={`/contact?artwork=${encodeURIComponent(artwork.title)}`}
                className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-5 text-sm text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
              >
                询洽此件作品
              </Link>
              <Link
                href="/collection"
                className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-5 text-sm text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                返回藏品浏览
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,0.95fr)_minmax(0,0.75fr)] md:px-10 md:py-20">
        <div>
          <p className="mb-4 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
            学术说明
          </p>
          <div className="rich-text space-y-5 text-[0.98rem]">
            {artwork.statement.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="grid gap-8">
          <div className="border-t border-[var(--line)] pt-5">
            <p className="mb-4 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
              来源
            </p>
            <ul className="rich-text">
              {artwork.provenance.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <p className="mb-4 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
              展览
            </p>
            <ul className="rich-text">
              {artwork.exhibitions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <p className="mb-4 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
              出版
            </p>
            <ul className="rich-text">
              {artwork.publications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="mb-3 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
                相关推荐
              </p>
              <h2 className="font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[3.5rem]">
                同类方向中的其他作品
              </h2>
            </div>
          </div>
          <div className="grid gap-8">
            {related.map((item) => (
              <ArtworkCard key={item.slug} artwork={item} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
