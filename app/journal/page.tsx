import Image from "next/image";
import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { PageHero } from "@/components/page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getPublicArticles, loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("文章", "Journal"),
    description: pageCopy.journal.hero.description,
    path: "/journal",
    site: siteConfig,
  });
}

export default async function JournalPage() {
  const content = await loadSiteContent();
  const articles = getPublicArticles(content);
  const { pageCopy } = content;
  const readAction = pageCopy.journal.readAction;

  return (
    <>
      <PageHero
        eyebrow={pageCopy.journal.hero.eyebrow}
        title={pageCopy.journal.hero.title}
        description={pageCopy.journal.hero.description}
        aside={pageCopy.journal.hero.aside}
      />

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-10">
          {articles.map((article) => (
            <article key={article.slug} className="grid gap-6 border-t border-[var(--line)] pt-7 md:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)]">
              <Link href={`/journal/${article.slug}`} className="relative overflow-hidden bg-[var(--surface-strong)]">
                <Image
                  src={article.cover}
                  alt={`${article.title.zh} ${article.title.en}`}
                  width={1400}
                  height={900}
                  unoptimized
                  className="aspect-[1.45/1] h-full w-full object-cover"
                />
              </Link>
              <div className="flex flex-col justify-between gap-5">
                <div className="space-y-5">
                  <BilingualText
                    as="p"
                    text={article.category}
                    mode="inline"
                    className="text-[var(--accent)]"
                    zhClassName="text-[0.72rem] tracking-[0.22em]"
                    enClassName="text-[0.5rem] uppercase tracking-[0.18em]"
                  />
                  <div>
                    <BilingualText
                      as="h2"
                      text={article.title}
                      className="font-serif text-[var(--ink)]"
                      zhClassName="block text-[2rem] leading-tight tracking-[-0.04em] md:text-[3.1rem]"
                      enClassName="mt-3 block font-sans text-[0.76rem] uppercase tracking-[0.22em] text-[var(--accent)]"
                    />
                  </div>
                  <p className="max-w-2xl text-sm leading-8 text-[var(--muted)] md:text-[0.98rem]">
                    {article.excerpt.zh}
                  </p>
                </div>
                <div className="space-y-4 border-t border-[var(--line)] pt-5 text-sm leading-7 text-[var(--muted)]">
                  <div className="grid gap-3 md:grid-cols-3">
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
                  <Link href={`/journal/${article.slug}`} className="inline-flex text-sm text-[var(--ink)]">
                    <ActionLabel text={readAction} align="start" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
