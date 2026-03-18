import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { ExpandableBilingualCopy } from "@/components/expandable-bilingual-copy";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProtectedImage } from "@/components/protected-image";
import { getArticleDisplayExcerpt } from "@/lib/article-content";
import { bt } from "@/lib/bilingual";
import { withImageVersion } from "@/lib/image-url";
import { buildMetadata } from "@/lib/metadata";
import type { ImageAsset } from "@/lib/site-data";
import { getPublicArticles, loadSiteContent } from "@/lib/site-data";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("文章与动态", "Journal"),
    description: pageCopy.journal.hero.description,
    path: "/journal",
    site: siteConfig,
  });
}

function JournalCover({
  cover,
  coverAsset,
  title,
}: {
  cover: string;
  coverAsset?: ImageAsset;
  title: { zh: string; en: string };
}) {
  const cardImage = coverAsset?.card ?? cover;
  const isPlaceholder = cardImage.startsWith("/api/placeholder/");

  if (isPlaceholder) {
    return (
      <div className="aspect-[1.45/1]">
        <MediaPlaceholder eyebrow="Journal Image" title={title.zh} />
      </div>
    );
  }

  return (
    <ProtectedImage
      src={withImageVersion(cardImage)}
      alt={`${title.zh} ${title.en}`}
      width={1400}
      height={900}
      quality={84}
      sizes="(min-width: 1024px) 44vw, 100vw"
      wrapperClassName="block"
      className="aspect-[1.45/1] h-full w-full object-cover"
    />
  );
}

export default async function JournalPage() {
  const content = await loadSiteContent();
  const articles = getPublicArticles(content);
  const { pageCopy } = content;
  const readAction = pageCopy.journal.readAction;

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 pb-5 pt-8 md:px-8 md:pb-6 md:pt-9 lg:px-10 lg:pb-7">
        <div className="border-b border-[var(--line)]/80 pb-5 lg:grid lg:grid-cols-[minmax(0,0.64fr)_minmax(300px,0.36fr)] lg:items-end lg:gap-9 lg:pb-6">
          <div className="space-y-2.5">
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
              zhClassName="block text-[clamp(2.05rem,2.9vw,2.7rem)] leading-[1.04] tracking-[-0.043em]"
              enClassName="mt-2 block text-[0.68rem] uppercase tracking-[0.16em] text-[var(--accent)]/58"
            />
          </div>
          <div className="mt-4 max-w-[26rem] border-t border-[var(--line)]/70 pt-3 lg:mt-0 lg:max-w-[22rem] lg:border-t-0 lg:pt-0">
            <BilingualText
              as="div"
              text={pageCopy.journal.hero.description}
              className="max-w-[24ch] text-[var(--muted)]"
              zhClassName="block text-[0.9rem] leading-7"
              enClassName="mt-2 block text-[0.62rem] uppercase tracking-[0.14em] leading-6 text-[var(--accent)]/64"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-9">
          {articles.map((article) => {
            const displayExcerpt = getArticleDisplayExcerpt(article);

            return (
            <article
              key={article.slug}
              className="grid gap-5 border-t border-[var(--line)]/85 pt-6 lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)] lg:gap-7"
            >
              <Link href={`/journal/${article.slug}`} className="relative overflow-hidden bg-[var(--surface-strong)]">
                <JournalCover cover={article.cover} coverAsset={article.coverAsset} title={article.title} />
              </Link>
              <div className="flex flex-col justify-between gap-5">
                <div className="space-y-3.5">
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
                      zhClassName="block max-w-[15ch] text-[clamp(1.38rem,1.8vw,1.95rem)] leading-[1.06] tracking-[-0.036em]"
                      enClassName="mt-1.5 block font-sans text-[0.64rem] uppercase tracking-[0.18em] text-[var(--accent)]/56"
                    />
                  </div>
                  <ExpandableBilingualCopy
                    text={displayExcerpt}
                    collapsedClassName="max-h-[7.2rem] md:max-h-[9.2rem]"
                    zhClassName="max-w-[36ch] text-[0.96rem] leading-[2.02] text-[var(--muted)]/94"
                    enClassName="max-w-[42ch] text-[0.8rem] leading-[1.78] tracking-[0.02em] text-[var(--accent)]/74"
                  />
                </div>
                <div className="space-y-3.5 border-t border-[var(--line)]/75 pt-4 text-sm leading-7 text-[var(--muted)]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-[var(--line)]/68 py-2 text-[0.8rem] leading-7 text-[var(--muted)]/92">
                    <span className="select-none">{article.date}</span>
                    <span className="h-[10px] w-px bg-[var(--line)]/75" aria-hidden="true" />
                    <BilingualText
                      as="span"
                      text={article.author}
                      mode="inline"
                      className="select-none"
                      zhClassName="text-[0.8rem]"
                      enClassName="text-[0.5rem] uppercase tracking-[0.14em] text-[var(--accent)]/66"
                    />
                    <span className="h-[10px] w-px bg-[var(--line)]/75" aria-hidden="true" />
                    <BilingualText
                      as="span"
                      text={article.column}
                      mode="inline"
                      className="select-none"
                      zhClassName="text-[0.8rem]"
                      enClassName="text-[0.5rem] uppercase tracking-[0.14em] text-[var(--accent)]/66"
                    />
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--line)]/62 pt-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {article.keywords.map((keyword) => (
                        <span
                          key={keyword.zh}
                          className="border border-[var(--line)]/65 px-2.5 py-0.5 text-[10px] tracking-[0.1em] text-[var(--muted)]/84"
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
          )})}
        </div>
      </section>
    </>
  );
}
