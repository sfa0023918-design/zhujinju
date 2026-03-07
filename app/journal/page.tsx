import Image from "next/image";
import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { PageHero } from "@/components/page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { articles } from "@/lib/site-data";

export const metadata = buildMetadata({
  title: bt("文章", "Journal"),
  description: bt("阅读竹瑾居发布的展览资讯、研究文章、市场观察与学术短文。", "Read exhibition notes, research writing, market observations, and short scholarly texts from Zhu Jin Ju."),
  path: "/journal",
});

export default function JournalPage() {
  return (
    <>
      <PageHero
        eyebrow={bt("文章", "Journal")}
        title={bt("文章", "Journal")}
        description={bt(
          "用于发布研究短文、展览札记与市场观察。整体样式更接近艺廊 journal，而非资讯门户。",
          "A space for short research writing, exhibition notes, and market observations, conceived more as a gallery journal than a news portal."
        )}
        aside={bt(
          "栏目按观看方法、作品判断与策展工作展开，使文章、展览与藏品之间可以互相参照。",
          "Texts are organized around ways of looking, object judgement, and curatorial practice so that articles, exhibitions, and works can be read in relation."
        )}
      />

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-12">
          {articles.map((article) => (
            <article key={article.slug} className="grid gap-6 border-t border-[var(--line)] pt-6 md:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]">
              <Link href={`/journal/${article.slug}`} className="relative overflow-hidden bg-[var(--surface-strong)]">
                <Image
                  src={article.cover}
                  alt={`${article.title.zh} ${article.title.en}`}
                  width={1400}
                  height={900}
                  unoptimized
                  className="aspect-[1.3/1] h-full w-full object-cover"
                />
              </Link>
              <div className="space-y-4">
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
                    zhClassName="block text-[2rem] leading-tight tracking-[-0.04em] md:text-[3rem]"
                    enClassName="mt-3 block font-sans text-[0.76rem] uppercase tracking-[0.22em] text-[var(--accent)]"
                  />
                  <p className="mt-3 text-sm text-[var(--muted)]">{article.date}</p>
                </div>
                <div className="grid gap-3 text-sm leading-7 text-[var(--muted)] md:grid-cols-[0.9fr_1.1fr]">
                  <p>{article.author.zh}</p>
                  <p>{article.column.zh}</p>
                </div>
                <p className="max-w-2xl text-sm leading-8 text-[var(--muted)] md:text-[0.98rem]">
                  {article.excerpt.zh}
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((keyword) => (
                    <span key={keyword.zh} className="border border-[var(--line)] px-3 py-1 text-[0.72rem] tracking-[0.08em] text-[var(--muted)]">
                      {keyword.zh}
                    </span>
                  ))}
                </div>
                <Link href={`/journal/${article.slug}`} className="inline-flex text-sm text-[var(--ink)]">
                  <ActionLabel text={bt("阅读全文", "Read Article")} align="start" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
