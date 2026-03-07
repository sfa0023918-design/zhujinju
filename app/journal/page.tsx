import Image from "next/image";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { buildMetadata } from "@/lib/metadata";
import { articles } from "@/lib/site-data";

export const metadata = buildMetadata({
  title: "文章",
  description: "阅读竹瑾居发布的展览资讯、研究文章、市场观察与学术短文。",
  path: "/journal",
});

export default function JournalPage() {
  return (
    <>
      <PageHero
        eyebrow="Journal"
        title="文章"
        description="用于发布研究短文、展览札记与市场观察。整体样式更接近艺廊 journal，而非资讯门户。"
        aside="文章页采用低干扰阅读布局，便于后续接入更完整的编辑内容与目录结构。"
      />

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-12">
          {articles.map((article) => (
            <article key={article.slug} className="grid gap-6 border-t border-[var(--line)] pt-6 md:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)]">
              <Link href={`/journal/${article.slug}`} className="relative overflow-hidden bg-[var(--surface-strong)]">
                <Image
                  src={article.cover}
                  alt={article.title}
                  width={1400}
                  height={900}
                  unoptimized
                  className="aspect-[1.3/1] h-full w-full object-cover"
                />
              </Link>
              <div className="space-y-4">
                <p className="text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
                  {article.category}
                </p>
                <div>
                  <h2 className="font-serif text-[2rem] leading-tight tracking-[-0.04em] text-[var(--ink)] md:text-[3rem]">
                    {article.title}
                  </h2>
                  <p className="mt-3 text-sm text-[var(--muted)]">{article.date}</p>
                </div>
                <p className="max-w-2xl text-sm leading-8 text-[var(--muted)] md:text-[0.98rem]">
                  {article.excerpt}
                </p>
                <Link href={`/journal/${article.slug}`} className="inline-flex text-sm text-[var(--ink)]">
                  阅读全文
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
