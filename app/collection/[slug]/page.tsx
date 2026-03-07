import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionLabel } from "@/components/action-label";
import { ArtworkGallery } from "@/components/artwork-gallery";
import { BilingualText } from "@/components/bilingual-text";
import { ArtworkCard } from "@/components/artwork-card";
import { StatusPill } from "@/components/status-pill";
import { bt, formatInlineText } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticlesBySlugs,
  getArtworkBySlug,
  getExhibitionsBySlugs,
  getRelatedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

type ArtworkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const content = await loadSiteContent();

  return content.artworks.map((artwork) => ({
    slug: artwork.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await loadSiteContent();
  const artwork = getArtworkBySlug(content, slug);

  if (!artwork) {
    return buildMetadata({
      title: content.pageCopy.artworkDetail.errorTitle,
      description: content.pageCopy.artworkDetail.errorDescription,
      path: "/collection",
      site: content.siteConfig,
    });
  }

  return buildMetadata({
    title: artwork.title,
    description: artwork.excerpt,
    path: `/collection/${artwork.slug}`,
    site: content.siteConfig,
  });
}

export default async function ArtworkDetailPage({ params }: ArtworkDetailPageProps) {
  const { slug } = await params;
  const content = await loadSiteContent();
  const artwork = getArtworkBySlug(content, slug);

  if (!artwork) {
    notFound();
  }

  const related = getRelatedArtworks(content, artwork.slug, artwork.category.zh);
  const relatedArticles = getArticlesBySlugs(content, artwork.relatedArticleSlugs);
  const relatedExhibitions = getExhibitionsBySlugs(content, artwork.relatedExhibitionSlugs);
  const detailCopy = content.pageCopy.artworkDetail;
  const fieldRows = [
    { label: detailCopy.fieldLabels.period, key: "period" },
    { label: detailCopy.fieldLabels.regionOrigin, key: "regionOrigin" },
    { label: detailCopy.fieldLabels.material, key: "material" },
    { label: detailCopy.fieldLabels.dimensions, key: "dimensions" },
  ] as const;

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 py-8 md:px-10 md:py-12">
        <div className="mb-8 text-sm text-[var(--muted)]">
          <Link href="/collection" className="transition-colors hover:text-[var(--ink)]">
            {formatInlineText(detailCopy.breadcrumb)}
          </Link>
          <span className="px-2">/</span>
          <span>{formatInlineText(artwork.title)}</span>
        </div>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.04fr)_minmax(280px,0.48fr)] md:gap-14">
          <ArtworkGallery
            title={formatInlineText(artwork.title)}
            primaryImage={artwork.image}
            gallery={artwork.gallery}
          />
          <aside className="space-y-7 md:sticky md:top-8 md:self-start">
            <div className="space-y-5 border-t border-[var(--line)] pt-5">
              <div className="flex items-center justify-between gap-4">
                <BilingualText
                  as="p"
                  text={artwork.category}
                  mode="inline"
                  className="text-[var(--accent)]"
                  zhClassName="text-[0.74rem] tracking-[0.16em]"
                  enClassName="text-[0.5rem] uppercase tracking-[0.18em]"
                />
                <StatusPill status={artwork.status} />
              </div>
              <div>
                <BilingualText
                  as="h1"
                  text={artwork.title}
                  className="font-serif text-[var(--ink)]"
                  zhClassName="block text-[2.5rem] leading-[0.96] tracking-[-0.05em] md:text-[4.35rem]"
                  enClassName="mt-2 block font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent)]/78 md:text-[0.76rem]"
                />
                <BilingualText
                  as="p"
                  text={artwork.subtitle}
                  mode="inline"
                  className="mt-2 text-[var(--muted)]"
                  zhClassName="text-sm leading-7 md:text-[0.98rem]"
                  enClassName="text-[0.72rem] leading-6 text-[var(--accent)]/75"
                />
              </div>
              <p className="text-sm leading-8 text-[var(--muted)]">{artwork.excerpt.zh}</p>
            </div>

            <dl className="divide-y divide-[var(--line)] border-t border-[var(--line)] pt-1 text-sm">
              {fieldRows.map((field) => (
                <div key={field.key} className="grid grid-cols-[112px_1fr] gap-4 py-4">
                  <BilingualText
                    as="dt"
                    text={field.label}
                    mode="inline"
                    className="text-[var(--accent)]"
                    zhClassName="text-[0.72rem] tracking-[0.18em]"
                    enClassName="text-[0.48rem] uppercase tracking-[0.16em]"
                  />
                  <BilingualText
                    as="dd"
                    text={
                      field.key === "regionOrigin"
                        ? bt(`${artwork.region.zh} · ${artwork.origin.zh}`, `${artwork.region.en} · ${artwork.origin.en}`)
                        : artwork[field.key]
                    }
                    mode="inline"
                    className="text-[var(--muted)]"
                    zhClassName="block"
                    enClassName="text-[0.66rem] leading-6 text-[var(--accent)]/75"
                  />
                </div>
              ))}
            </dl>

            <div className="grid gap-4 border-t border-[var(--line)] pt-5">
              <Link
                href={`/contact?artwork=${encodeURIComponent(formatInlineText(artwork.title))}`}
                className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-5 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
              >
                <ActionLabel text={detailCopy.inquireAction} />
              </Link>
              <ul className="grid gap-px border border-[var(--line)] bg-[var(--line)] text-[0.82rem] leading-6 text-[var(--muted)]">
                {artwork.inquirySupport.map((item) => (
                  <li key={item.zh} className="bg-[var(--surface)] px-4 py-3">
                    {item.zh}
                  </li>
                ))}
              </ul>
              <Link
                href="/collection"
                className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-5 text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                <ActionLabel text={detailCopy.backAction} />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-16 md:grid-cols-[minmax(0,0.95fr)_minmax(0,0.75fr)] md:px-10 md:py-24">
        <div>
          <BilingualText
            as="p"
            text={detailCopy.scholarlyNote}
            mode="inline"
            className="mb-4 text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.22em]"
            enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
          />
          <div className="space-y-8">
            <div>
              <BilingualText
                as="h2"
                text={detailCopy.viewingNote}
                mode="inline"
                className="mb-3 text-[var(--accent)]"
                zhClassName="text-[0.78rem] tracking-[0.16em]"
                enClassName="text-[0.54rem] uppercase tracking-[0.16em] text-[var(--accent)]/72"
              />
              <p className="rich-text text-[0.98rem] leading-8 text-[var(--muted)]">
                {artwork.viewingNote.zh}
              </p>
            </div>
            <div>
              <BilingualText
                as="h2"
                text={detailCopy.comparisonNote}
                mode="inline"
                className="mb-3 text-[var(--accent)]"
                zhClassName="text-[0.78rem] tracking-[0.16em]"
                enClassName="text-[0.54rem] uppercase tracking-[0.16em] text-[var(--accent)]/72"
              />
              <p className="rich-text text-[0.98rem] leading-8 text-[var(--muted)]">
                {artwork.comparisonNote.zh}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-7">
          <div className="border-t border-[var(--line)] pt-5">
            <BilingualText
              as="h2"
              text={detailCopy.provenance}
              mode="inline"
              className="mb-4 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
            />
            <ul className="space-y-3">
              {artwork.provenance.map((item) => (
                <li key={item.label.zh}>
                  <p className="text-sm leading-7 text-[var(--muted)]">{item.label.zh}</p>
                  {item.note ? (
                    <p className="mt-1 text-[0.82rem] leading-6 text-[var(--accent)]/78">{item.note.zh}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <BilingualText
              as="h2"
              text={detailCopy.exhibitions}
              mode="inline"
              className="mb-4 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
            />
            <ul className="space-y-3">
              {artwork.exhibitions.map((item) => (
                <li key={`${item.title.zh}-${item.year}`}>
                  <p className="text-sm leading-7 text-[var(--muted)]">{item.title.zh}</p>
                  <p className="mt-1 text-[0.82rem] leading-6 text-[var(--accent)]/78">
                    {item.venue.zh}，{item.year}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <BilingualText
              as="h2"
              text={detailCopy.publications}
              mode="inline"
              className="mb-4 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
            />
            <ul className="space-y-3">
              {artwork.publications.map((item) => (
                <li key={`${item.title.zh}-${item.year}`}>
                  <p className="text-sm leading-7 text-[var(--muted)]">{item.title.zh}</p>
                  <p className="mt-1 text-[0.82rem] leading-6 text-[var(--accent)]/78">
                    {item.year}，{item.pages.zh}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-[0.82rem] leading-6 text-[var(--accent)]/78">{item.note.zh}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          {relatedExhibitions.length > 0 ? (
            <div className="border-t border-[var(--line)] pt-5">
              <BilingualText
                as="h2"
                text={detailCopy.relatedExhibitions}
                mode="inline"
                className="mb-4 text-[var(--accent)]"
                zhClassName="text-[0.72rem] tracking-[0.22em]"
                enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
              />
              <div className="space-y-3">
                {relatedExhibitions.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/exhibitions/${item.slug}`}
                    className="block text-sm leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    {item.title.zh}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {relatedArticles.length > 0 ? (
            <div className="border-t border-[var(--line)] pt-5">
              <BilingualText
                as="h2"
                text={detailCopy.relatedArticles}
                mode="inline"
                className="mb-4 text-[var(--accent)]"
                zhClassName="text-[0.72rem] tracking-[0.22em]"
                enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
              />
              <div className="space-y-3">
                {relatedArticles.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/journal/${item.slug}`}
                    className="block text-sm leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    {item.title.zh}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-16 md:px-10 md:py-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <BilingualText
                as="p"
                text={detailCopy.relatedWorks}
                mode="inline"
                className="mb-3 text-[var(--accent)]"
                zhClassName="text-[0.72rem] tracking-[0.22em]"
                enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
              />
              <BilingualText
                as="h2"
                text={detailCopy.relatedWorksTitle}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[2rem] leading-none tracking-[-0.04em] md:text-[3.5rem]"
                enClassName="mt-2 block font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent)]/78"
              />
            </div>
          </div>
          <div className="grid gap-7">
            {related.map((item) => (
              <ArtworkCard key={item.slug} artwork={item} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
