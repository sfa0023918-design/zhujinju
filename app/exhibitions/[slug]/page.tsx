import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { BilingualProse, BilingualReadingPanel } from "@/components/bilingual-prose";
import { ArtworkCard } from "@/components/artwork-card";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { getAdminSession } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticlesBySlugs,
  getExhibitionBySlug,
  getHighlightedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

export const dynamic = "force-dynamic";

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
  const detailHeadingZhClass = "block max-w-[13ch] text-[clamp(2.1rem,3.95vw,3.6rem)] leading-[0.95] tracking-[-0.044em] text-balance md:max-w-[11ch]";
  const detailHeadingEnClass = "mt-3 block max-w-[32rem] font-sans text-[0.76rem] uppercase tracking-[0.18em] leading-[1.48] text-[var(--accent)]/84 md:text-[0.8rem]";
  const featuredWorksCount = exhibition.featuredWorksCount ?? exhibition.highlightCount ?? highlightArtworks.length;
  const cataloguePageCount = exhibition.cataloguePageCount ?? exhibition.cataloguePages ?? 0;
  const catalogueTitle = exhibition.catalogueTitle;
  const catalogueNote = exhibition.catalogueNote ?? exhibition.catalogueIntro;
  const curatorialNote = exhibition.curatorialNote ?? exhibition.curatorialLead;

  return (
    <>
      <section className="mx-auto grid w-full max-w-[1480px] gap-7 px-5 py-7 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10 lg:py-10">
        <div className="space-y-6">
          <Link href="/exhibitions" className="inline-flex text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
            <ActionLabel text={detailCopy.backAction} align="start" />
          </Link>
        <div className="space-y-4">
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
        <div className="space-y-3 border-t border-[var(--line)] pt-5 text-[0.92rem] leading-7 text-[var(--muted)] md:space-y-2.5 md:pt-1">
          <BilingualText as="p" text={exhibition.period} mode="inline" className="block" zhClassName="block" enClassName="text-[0.76rem] leading-[1.45] text-[var(--accent)]/82" />
          <BilingualText as="p" text={exhibition.venue} mode="inline" className="block" zhClassName="block" enClassName="text-[0.76rem] leading-[1.45] text-[var(--accent)]/82" />
          {getPrimaryText(catalogueTitle) ? (
            <BilingualText as="p" text={catalogueTitle} mode="inline" className="block" zhClassName="block" enClassName="text-[0.76rem] leading-[1.45] text-[var(--accent)]/82" />
          ) : null}
          <div className="space-y-2 border-t border-[var(--line)]/70 pt-3">
            <InfoFact label={detailCopy.summaryLine.highlightUnit} value={{ zh: `${featuredWorksCount} 件`, en: `${featuredWorksCount} works` }} />
            <InfoFact label={detailCopy.summaryLine.catalogueUnit} value={{ zh: `${cataloguePageCount} 页`, en: `${cataloguePageCount} pages` }} />
            {getPrimaryText(catalogueTitle) ? (
              <InfoFact label={catalogueTitleLabel} value={catalogueTitle} />
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-14 md:px-8 md:pb-18 lg:px-10 lg:pb-20">
        <div className="relative overflow-hidden bg-[var(--surface-strong)] max-h-[360px] md:max-h-[440px] lg:max-h-[520px]">
          {exhibition.cover.startsWith("/api/placeholder/") ? (
            <div className="aspect-[1.9/1] h-full max-h-[inherit]">
              <MediaPlaceholder eyebrow="Exhibition Image" title={exhibition.title.zh} />
            </div>
          ) : (
            <Image
              src={exhibition.cover}
              alt={`${exhibition.title.zh} ${exhibition.title.en}`}
              width={1800}
              height={1100}
              priority
              unoptimized
              className="aspect-[1.9/1] h-full max-h-[inherit] w-full object-cover"
            />
          )}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,0.8fr)] lg:px-10 lg:py-20">
        <div className="max-w-[42rem]">
          <BilingualReadingPanel
            sections={[
              {
                key: "intro",
                label: exhibitionTextLabel,
                content: exhibition.intro,
                variant: "lead",
              },
              {
                key: "description",
                content: exhibition.description,
                variant: "body",
              },
            ]}
            defaultLocale="zh"
          />
        </div>
        <div className="border-t border-[var(--line)] pt-5 md:border-t-0 md:border-l md:pl-8 md:pt-0">
          <BilingualReadingPanel
            className="space-y-6"
            sections={[
              {
                key: "catalogue-intro",
                label: detailCopy.catalogueNote,
                content: catalogueNote,
                variant: "secondary",
              },
              {
                key: "curatorial-lead",
                label: curatorialLeadLabel,
                content: curatorialNote,
                variant: "secondary",
              },
            ]}
            defaultLocale="zh"
          />
          {relatedArticles.length > 0 ? (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <BilingualText
                as="p"
                text={detailCopy.relatedWriting}
                mode="inline"
                className="mb-4 text-[var(--accent)]"
                zhClassName="text-[0.72rem] tracking-[0.22em]"
                enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
              />
              <div className="space-y-3">
                {relatedArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/journal/${article.slug}`}
                    className="block text-sm leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    {article.title.zh}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
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
