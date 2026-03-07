import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buildMetadata } from "@/lib/metadata";
import { articles, getArticleBySlug } from "@/lib/site-data";

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
      title: "文章未找到",
      description: "当前文章不存在或尚未公开。",
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

  return (
    <>
      <section className="mx-auto w-full max-w-[1120px] px-5 py-8 md:px-10 md:py-12">
        <Link href="/journal" className="inline-flex text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
          返回文章
        </Link>
      </section>

      <article className="mx-auto w-full max-w-[1120px] px-5 pb-20 md:px-10 md:pb-28">
        <header className="space-y-5 border-t border-[var(--line)] pt-6">
          <p className="text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
            {article.category}
          </p>
          <h1 className="max-w-4xl font-serif text-[2.8rem] leading-[0.94] tracking-[-0.05em] text-[var(--ink)] md:text-[5rem]">
            {article.title}
          </h1>
          <p className="text-sm text-[var(--muted)]">{article.date}</p>
        </header>

        <div className="mt-8 relative overflow-hidden bg-[var(--surface-strong)]">
          <Image
            src={article.cover}
            alt={article.title}
            width={1600}
            height={1000}
            priority
            unoptimized
            className="aspect-[1.55/1] h-full w-full object-cover"
          />
        </div>

        <div className="rich-text mt-10 max-w-3xl text-[1rem] md:text-[1.05rem]">
          {article.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </>
  );
}
