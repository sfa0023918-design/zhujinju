import Image from "next/image";
import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { MediaPlaceholder } from "@/components/media-placeholder";
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

function JournalCover({
  cover,
  title,
}: {
  cover: string;
  title: { zh: string; en: string };
}) {
  const isPlaceholder = cover.startsWith("/api/placeholder/");

  if (isPlaceholder) {
    return (
      <div className="aspect-[1.45/1]">
        <MediaPlaceholder eyebrow="Journal Image" title={title.zh} />
      </div>
    );
  }

  return (
    <Image
      src={cover}
      alt={`${title.zh} ${title.en}`}
      width={1400}
      height={900}
      unoptimized
      className="aspect-[1.45/1] h-full w-full object-cover"
    />
  );
}

export default async function JournalPage() {
  const content = await loadSiteContent();
  const articles = getPublicArticles(content);
  const { pageCopy } = content;
  const readAction = pageCopy.journal.readAction;
  const heroAside = pageCopy.journal.hero.aside?.zh ?? pageCopy.journal.hero.description.en;

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 pb-6 pt-9 md:px-8 md:pb-7 md:pt-10 lg:px-10 lg:pb-8">
        <div className="border-b border-[var(--line)]/80 pb-6 lg:grid lg:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)] lg:items-end lg:gap-10 lg:pb-8">
          <div className="space-y-3">
            <BilingualText
              as="p"
              text={pageCopy.journal.hero.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.24em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.16em] text-[var(--accent)]/68"
            />
            <BilingualText
              as="h1"
              text={pageCopy.journal.hero.title}
              className="font-serif text-[var(--ink)]"
              zhClassName="block text-[clamp(2.25rem,3.2vw,3rem)] leading-[1.04] tracking-[-0.045em]"
              enClassName="mt-2.5 block text-[0.72rem] uppercase tracking-[0.18em] text-[var(--accent)]/60"
            />
          </div>
          <div className="mt-4 max-w-[29rem] space-y-2.5 border-t border-[var(--line)]/70 pt-3 lg:mt-0 lg:max-w-[24rem] lg:border-t-0 lg:pt-0">
            <p className="max-w-[24ch] text-[0.92rem] leading-7 text-[var(--muted)]">
              {pageCopy.journal.hero.description.zh}
            </p>
            <p className="max-w-[30ch] text-[0.88rem] leading-7 text-[var(--muted)]/88">{heroAside}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-9">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="grid gap-5 border-t border-[var(--line)]/85 pt-6 lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] lg:gap-7"
            >
              <Link href={`/journal/${article.slug}`} className="relative overflow-hidden bg-[var(--surface-strong)]">
                <JournalCover cover={article.cover} title={article.title} />
              </Link>
              <div className="flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <BilingualText
                    as="p"
                    text={article.category}
                    mode="inline"
                    className="text-[var(--accent)]"
                    zhClassName="text-[0.7rem] tracking-[0.2em]"
                    enClassName="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--accent)]/64"
                  />
                  <div>
                    <BilingualText
                      as="h2"
                      text={article.title}
                      className="font-serif text-[var(--ink)]"
                      zhClassName="block text-[clamp(1.48rem,1.95vw,2.15rem)] leading-[1.06] tracking-[-0.038em]"
                      enClassName="mt-2 block font-sans text-[0.68rem] uppercase tracking-[0.22em] text-[var(--accent)]/58"
                    />
                  </div>
                  <p className="max-w-[30ch] text-[0.94rem] leading-7 text-[var(--muted)]">
                    {article.excerpt.zh}
                  </p>
                </div>
                <div className="space-y-4 border-t border-[var(--line)]/75 pt-4 text-sm leading-7 text-[var(--muted)]">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-[var(--line)]/70 py-2.5 text-[0.82rem] leading-7 text-[var(--muted)]/92">
                    <span className="select-none">{article.date}</span>
                    <span className="h-[10px] w-px bg-[var(--line)]/75" aria-hidden="true" />
                    <span className="select-none">{article.author.zh}</span>
                    <span className="h-[10px] w-px bg-[var(--line)]/75" aria-hidden="true" />
                    <span className="select-none">{article.column.zh}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)]/65 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {article.keywords.map((keyword) => (
                        <span
                          key={keyword.zh}
                          className="border border-[var(--line)]/70 px-2.5 py-1 text-[10px] tracking-[0.12em] text-[var(--muted)]/90"
                        >
                          {keyword.zh}
                        </span>
                      ))}
                    </div>
                    <Link href={`/journal/${article.slug}`} className="inline-flex text-sm text-[var(--ink)]">
                      <ActionLabel text={readAction} align="start" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
