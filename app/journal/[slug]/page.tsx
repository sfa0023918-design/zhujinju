import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { getAdminSession } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticleBySlug,
  getExhibitionsBySlugs,
  getHighlightedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

export const dynamic = "force-dynamic";

type ArticleDetailPageProps = {
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
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const article = getArticleBySlug(content, slug, { includeDrafts });

  if (!article) {
    return buildMetadata({
      title: content.pageCopy.articleDetail.errorTitle,
      description: content.pageCopy.articleDetail.errorDescription,
      path: "/journal",
      site: content.siteConfig,
    });
  }

  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/journal/${article.slug}`,
    type: "article",
    site: content.siteConfig,
  });
}

export default async function ArticleDetailPage({ params, searchParams }: ArticleDetailPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const article = getArticleBySlug(content, slug, { includeDrafts });

  if (!article) {
    notFound();
  }

  const relatedExhibitions = getExhibitionsBySlugs(content, article.relatedExhibitionSlugs);
  const relatedArtworks = getHighlightedArtworks(content, article.relatedArtworkSlugs);
  const detailCopy = content.pageCopy.articleDetail;

  return (
    <>
      <section className="mx-auto w-full max-w-[1120px] px-5 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
        <Link href="/journal" className="inline-flex text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
          <ActionLabel text={detailCopy.backAction} align="start" />
        </Link>
      </section>

      <article className="mx-auto w-full max-w-[1120px] px-5 pb-20 md:px-8 md:pb-24 lg:px-10 lg:pb-28">
        <header className="space-y-5 border-t border-[var(--line)] pt-6">
          <BilingualText
            as="p"
            text={article.category}
            mode="inline"
            className="text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.22em]"
            enClassName="text-[0.5rem] uppercase tracking-[0.18em]"
          />
          <BilingualText
            as="h1"
            text={article.title}
            className="max-w-4xl font-serif text-[var(--ink)]"
            zhClassName="block text-[2.8rem] leading-[0.94] tracking-[-0.05em] md:text-[5rem]"
            enClassName="mt-3 block font-sans text-[0.82rem] uppercase tracking-[0.22em] text-[var(--accent)]"
          />
          <div className="grid gap-3 text-sm text-[var(--muted)] md:grid-cols-3">
            <p>{article.date}</p>
            <p>{article.author.zh}</p>
            <p>{article.column.zh}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {article.keywords.map((keyword) => (
              <span key={keyword.zh} className="border border-[var(--line)] px-3 py-1 text-[0.72rem] tracking-[0.08em] text-[var(--muted)]">
                {keyword.zh}
              </span>
            ))}
          </div>
        </header>

        <div className="relative mt-8 overflow-hidden bg-[var(--surface-strong)]">
          {article.cover.startsWith("/api/placeholder/") ? (
            <div className="aspect-[1.55/1]">
              <MediaPlaceholder eyebrow="Journal Image" title={article.title.zh} />
            </div>
          ) : (
            <Image
              src={article.cover}
              alt={`${article.title.zh} ${article.title.en}`}
              width={1600}
              height={1000}
              priority
              unoptimized
              className="aspect-[1.55/1] h-full w-full object-cover"
            />
          )}
        </div>

        <div className="mt-10 space-y-6">
          {article.body.map((paragraph) => (
            <p key={paragraph.zh} className="max-w-3xl text-[1rem] leading-8 text-[var(--muted)] md:text-[1.05rem]">
              {paragraph.zh}
            </p>
          ))}
        </div>

        {(relatedExhibitions.length > 0 || relatedArtworks.length > 0) ? (
          <section className="mt-16 grid gap-10 border-t border-[var(--line)] pt-8 md:grid-cols-2">
            {relatedExhibitions.length > 0 ? (
              <div>
                <BilingualText
                  as="p"
                  text={detailCopy.relatedExhibitions}
                  mode="inline"
                  className="mb-4 text-[var(--accent)]"
                  zhClassName="text-[0.72rem] tracking-[0.22em]"
                  enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
                />
                <div className="space-y-3">
                  {relatedExhibitions.map((exhibition) => (
                    <Link
                      key={exhibition.slug}
                      href={`/exhibitions/${exhibition.slug}`}
                      className="block text-sm leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                    >
                      {exhibition.title.zh}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            {relatedArtworks.length > 0 ? (
              <div>
                <BilingualText
                  as="p"
                  text={detailCopy.relatedWorks}
                  mode="inline"
                  className="mb-4 text-[var(--accent)]"
                  zhClassName="text-[0.72rem] tracking-[0.22em]"
                  enClassName="text-[0.48rem] uppercase tracking-[0.16em] text-[var(--accent)]/76"
                />
                <div className="space-y-3">
                  {relatedArtworks.map((artwork) => (
                    <Link
                      key={artwork.slug}
                      href={`/collection/${artwork.slug}`}
                      className="block text-sm leading-7 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                    >
                      {artwork.title.zh}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </article>
    </>
  );
}
