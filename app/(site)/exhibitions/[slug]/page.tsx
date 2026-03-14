import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { HistoryBackLink } from "@/components/history-back-link";
import { ArtworkCard } from "@/components/artwork-card";
import { ExhibitionCatalogueViewer } from "@/components/exhibition-catalogue-viewer";
import { ExhibitionDetailReading } from "@/components/exhibition-detail-reading";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProtectedImage } from "@/components/protected-image";
import { getAdminSession } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticlesBySlugs,
  getExhibitionBySlug,
  getHighlightedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

type ExhibitionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    preview?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: ExhibitionDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const exhibition = getExhibitionBySlug(content, slug, { includeDrafts });

  if (!exhibition) {
    return buildMetadata({
      title: content.pageCopy.exhibitionDetail.errorTitle,
      description: content.pageCopy.exhibitionDetail.errorDescription,
      path: "/exhibitions",
      site: content.siteConfig,
    });
  }

  return buildMetadata({
    title: exhibition.title,
    description: exhibition.intro,
    path: `/exhibitions/${exhibition.slug}`,
    site: content.siteConfig,
  });
}

export default async function ExhibitionDetailPage({
  params,
  searchParams,
}: ExhibitionDetailPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const exhibition = getExhibitionBySlug(content, slug, { includeDrafts });

  if (!exhibition) {
    notFound();
  }

  const highlightArtworks = getHighlightedArtworks(content, exhibition.highlightArtworkSlugs);
  const relatedArticles = getArticlesBySlugs(content, exhibition.relatedArticleSlugs);
  const detailCopy = content.pageCopy.exhibitionDetail;
  const exhibitionTextLabel = { zh: "展览介绍", en: "Exhibition Text" };
  const curatorialLeadLabel = { zh: "策展说明", en: "Curatorial Note" };
  const catalogueTitleLabel = { zh: "图录标题", en: "Catalogue Title" };
  const detailHeadingZhClass =
    "block max-w-[10.5ch] text-[clamp(1.68rem,2.9vw,2.56rem)] leading-[0.93] tracking-[-0.042em] text-balance md:max-w-[9.5ch]";
  const detailHeadingEnClass =
    "mt-2.5 block max-w-[28rem] font-sans text-[0.72rem] uppercase tracking-[0.16em] leading-[1.46] text-[var(--accent)]/78 md:text-[0.76rem]";
  const featuredWorksCount = exhibition.featuredWorksCount ?? exhibition.highlightCount ?? highlightArtworks.length;
  const cataloguePageCount = exhibition.cataloguePageCount ?? exhibition.cataloguePages ?? 0;
  const cataloguePageImages = exhibition.cataloguePageImages?.filter(Boolean) ?? [];
  const catalogueTitle = exhibition.catalogueTitle;
  const catalogueNote = exhibition.catalogueNote ?? exhibition.catalogueIntro;
  const curatorialNote = exhibition.curatorialNote ?? exhibition.curatorialLead;

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 py-6 md:px-8 md:py-7 lg:px-10 lg:py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-6">
            <HistoryBackLink fallbackHref="/exhibitions" className="inline-flex text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
              <ActionLabel text={detailCopy.backAction} align="start" />
            </HistoryBackLink>
            <div className="space-y-3.5">
              <BilingualText
                as="p"
                text={exhibition.subtitle}
                mode="inline"
                className="text-[var(--accent)]"
                zhClassName="text-[0.72rem] tracking-[0.22em]"
                enClassName="text-[0.5rem] uppercase tracking-[0.18em]"
              />
              <BilingualText
                as="h1"
                text={exhibition.title}
                className="max-w-5xl font-serif text-[var(--ink)]"
                zhClassName={detailHeadingZhClass}
                enClassName={detailHeadingEnClass}
              />
            </div>
          </div>
          <div className="space-y-3.5 border-t border-[var(--line)] pt-4 text-[0.9rem] leading-7 text-[var(--muted)] md:space-y-3 lg:pt-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--line)]/62 pb-3 text-[0.84rem] leading-7 text-[var(--muted)]/92">
              <BilingualText
                as="span"
                text={exhibition.period}
                mode="inline"
                className="inline-flex"
                zhClassName="text-[0.86rem]"
                enClassName="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--accent)]/72"
              />
              <span className="h-[10px] w-px bg-[var(--line)]/72" aria-hidden="true" />
              <BilingualText
                as="span"
                text={exhibition.venue}
                mode="inline"
                className="inline-flex"
                zhClassName="text-[0.86rem]"
                enClassName="text-[0.66rem] uppercase tracking-[0.12em] text-[var(--accent)]/72"
              />
            </div>
            <div className="space-y-2.5 border-t border-[var(--line)]/65 pt-3">
              <InfoFact label={detailCopy.summaryLine.highlightUnit} value={{ zh: `${featuredWorksCount} 件`, en: `${featuredWorksCount} works` }} />
              <InfoFact label={detailCopy.summaryLine.catalogueUnit} value={{ zh: `${cataloguePageCount} 页`, en: `${cataloguePageCount} pages` }} />
              {getPrimaryText(catalogueTitle) ? <InfoFact label={catalogueTitleLabel} value={catalogueTitle} /> : null}
            </div>
            {cataloguePageImages.length > 0 ? (
              <Link
                href="#catalogue"
                className="inline-flex items-center rounded-full border border-[var(--line-strong)]/38 px-4 py-2 text-[0.76rem] tracking-[0.12em] text-[var(--ink)] transition-colors hover:border-[var(--line-strong)]/72 hover:bg-white/60"
              >
                查看电子图录 / View Catalogue
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-8 border border-[var(--line)]/65 bg-[var(--surface-strong)]">
          {exhibition.cover.startsWith("/api/placeholder/") ? (
            <div className="flex min-h-[220px] items-center justify-center px-4 py-4 md:min-h-[260px] md:px-6 md:py-5 lg:min-h-[300px] lg:px-8 lg:py-6">
              <MediaPlaceholder eyebrow="Exhibition Image" title={exhibition.title.zh} />
            </div>
          ) : (
            <div className="flex items-center justify-center px-3 py-3 md:px-5 md:py-4 lg:px-6 lg:py-5">
              <ProtectedImage
                src={exhibition.cover}
                alt={`${exhibition.title.zh} ${exhibition.title.en}`}
                width={1800}
                height={1100}
                priority
                unoptimized
                wrapperClassName="block"
                className="h-auto w-full max-w-full object-contain md:max-h-[56vh] lg:max-h-[62vh]"
              />
            </div>
          )}
        </div>
      </section>

      {cataloguePageImages.length > 0 ? (
        <section id="catalogue" className="mx-auto w-full max-w-[1480px] scroll-mt-24 px-5 pb-4 md:px-8 md:pb-6 lg:px-10 lg:pb-8">
          <ExhibitionCatalogueViewer
            title={catalogueTitle}
            note={catalogueNote}
            pages={cataloguePageImages}
          />
        </section>
      ) : null}

      <ExhibitionDetailReading
        introLabel={exhibitionTextLabel}
        intro={exhibition.intro}
        description={exhibition.description}
        catalogueNoteLabel={detailCopy.catalogueNote}
        catalogueNote={catalogueNote}
        curatorialLeadLabel={curatorialLeadLabel}
        curatorialLead={curatorialNote}
        relatedWritingLabel={detailCopy.relatedWriting}
        relatedArticles={relatedArticles.map((article) => ({ slug: article.slug, title: article.title }))}
      />

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <BilingualText
              as="p"
              text={detailCopy.highlightedWorks}
              className="mb-3 flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.22em]"
              enClassName="text-[0.54rem] uppercase tracking-[0.24em]"
            />
            <BilingualText
              as="h2"
              text={detailCopy.highlightedWorksTitle}
              className="font-serif text-[var(--ink)]"
              zhClassName="block text-[1.75rem] leading-none tracking-[-0.038em] md:text-[2.6rem]"
              enClassName="mt-2.5 block font-sans text-[0.72rem] uppercase tracking-[0.18em] text-[var(--accent)]/76"
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

function getPrimaryText(text: { zh: string; en: string } | undefined) {
  return text?.zh.trim() || text?.en.trim() || "";
}

function InfoFact({
  label,
  value,
}: {
  label: { zh: string; en: string };
  value: { zh: string; en: string };
}) {
  return (
    <div className="grid gap-1.5 border-b border-[var(--line)]/55 pb-2 last:border-b-0 last:pb-0">
      <BilingualText
        as="p"
        text={label}
        mode="inline"
        className="text-[var(--accent)]"
        zhClassName="text-[0.68rem] tracking-[0.18em]"
        enClassName="text-[0.5rem] uppercase tracking-[0.15em] text-[var(--accent)]/78"
      />
      <BilingualText
        as="p"
        text={value}
        mode="inline"
        className="text-[var(--muted)]"
        zhClassName="text-[0.96rem] leading-[1.65]"
        enClassName="text-[0.82rem] leading-[1.55] text-[var(--accent)]/84"
      />
    </div>
  );
}
