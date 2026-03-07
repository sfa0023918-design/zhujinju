import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import {
  articles,
  getArticleBySlug,
  getExhibitionsBySlugs,
  getHighlightedArtworks,
} from "@/lib/site-data";

type ArticleDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return buildMetadata({
      title: bt("文章未找到", "Article Not Found"),
      description: bt("当前文章不存在或尚未公开。", "This article is unavailable or not yet published."),
      path: "/journal",
    });
  }

  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/journal/${article.slug}`,
    type: "article",
  });
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedExhibitions = getExhibitionsBySlugs(article.relatedExhibitionSlugs);
  const relatedArtworks = getHighlightedArtworks(article.relatedArtworkSlugs);

  return (
    <>
      <section className="mx-auto w-full max-w-[1120px] px-5 py-8 md:px-10 md:py-12">
        <Link href="/journal" className="inline-flex text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
          <ActionLabel text={bt("返回文章", "Back to Journal")} align="start" />
        </Link>
      </section>

      <article className="mx-auto w-full max-w-[1120px] px-5 pb-20 md:px-10 md:pb-28">
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
          <Image
            src={article.cover}
            alt={`${article.title.zh} ${article.title.en}`}
            width={1600}
            height={1000}
            priority
            unoptimized
            className="aspect-[1.55/1] h-full w-full object-cover"
          />
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
                  text={bt("相关展览", "Related Exhibition")}
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
                  text={bt("相关藏品", "Related Works")}
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
