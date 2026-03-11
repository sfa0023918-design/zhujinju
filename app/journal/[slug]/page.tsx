import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { BilingualReadingPanel } from "@/components/bilingual-prose";
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
  const articleBodyLabel = { zh: "正文", en: "Essay" };
  const detailHeadingZhClass =
    "block max-w-[13.5ch] text-[clamp(1.98rem,3.45vw,3.15rem)] leading-[0.99] tracking-[-0.04em] text-balance md:max-w-[11.5ch]";
  const detailHeadingEnClass =
    "mt-2.5 block max-w-[30rem] font-sans text-[0.7rem] uppercase tracking-[0.16em] leading-[1.48] text-[var(--accent)]/78 md:text-[0.74rem]";

  return (
    <>
      <section className="mx-auto w-full max-w-[1120px] px-5 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <Link href="/journal" className="inline-flex text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
          <ActionLabel text={detailCopy.backAction} align="start" />
        </Link>
      </section>

      <article className="mx-auto w-full max-w-[1120px] px-5 pb-20 md:px-8 md:pb-24 lg:px-10 lg:pb-28">
        <header className="space-y-4 border-t border-[var(--line)] pt-5">
          <BilingualText
            as="p"
            text={article.category}
            mode="inline"
            className="text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.22em]"
            enClassName="text-[0.64rem] uppercase tracking-[0.16em] leading-[1.45] text-[var(--accent)]/76"
          />
          <BilingualText
            as="h1"
            text={article.title}
            className="max-w-4xl font-serif text-[var(--ink)]"
            zhClassName={detailHeadingZhClass}
            enClassName={detailHeadingEnClass}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-[var(--line)]/68 py-2 text-[0.84rem] leading-7 text-[var(--muted)]/92">
            <p className="select-none">{article.date}</p>
            <span className="h-[10px] w-px bg-[var(--line)]/72" aria-hidden="true" />
            <p className="select-none">{article.author.zh}</p>
            <span className="h-[10px] w-px bg-[var(--line)]/72" aria-hidden="true" />
            <p className="select-none">{article.column.zh}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-[var(--line)]/62 pt-3.5">
            {article.keywords.map((keyword) => (
              <span
                key={keyword.zh}
                className="border border-[var(--line)]/65 px-2.5 py-0.5 text-[0.68rem] tracking-[0.06em] text-[var(--muted)]/84"
              >
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

        <div className="mt-10 max-w-[42rem]">
          <BilingualReadingPanel
            sections={[
              {
                key: "excerpt",
                content: article.excerpt,
                variant: "lead",
              },
              {
                key: "body",
                label: articleBodyLabel,
                content: article.body,
                variant: "body",
              },
            ]}
            defaultLocale="zh"
          />
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
