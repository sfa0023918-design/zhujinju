import { BilingualText } from "@/components/bilingual-text";
import { PageHero } from "@/components/page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { brandIntro, operationalFacts } from "@/lib/site-data";

export const metadata = buildMetadata({
  title: bt("关于", "About"),
  description: bt("了解竹瑾居的定位、方法与长期工作的方向。", "Learn about the position, method, and long-term working direction of Zhu Jin Ju."),
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={bt("关于", "About")}
        title={bt("关于竹瑾居", "About Zhu Jin Ju")}
        description={bt(
          "竹瑾居是一家专注于喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术的品牌，服务对象包括藏家、博物馆、机构、策展人与研究者。",
          "Zhu Jin Ju is dedicated to Himalayan art, Tibetan Buddhist art, and related Asian antiquities, serving collectors, museums, institutions, curators, and researchers."
        )}
        aside={bt(
          "我们相信，真正可靠的古代艺术网站，不应以话术主导，而应以判断、结构与节制建立信任。",
          "A reliable site for historical art should be led not by rhetoric, but by judgement, structure, and restraint."
        )}
      />

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:px-10 md:py-20">
        <div>
          <BilingualText
            as="p"
            text={bt("定位", "Position")}
            mode="inline"
            className="mb-4 text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.22em]"
            enClassName="text-[0.5rem] uppercase tracking-[0.18em]"
          />
          <BilingualText
            as="h2"
            text={bt("工作围绕收藏、研究、展览与图录展开。", "The Work Is Structured Around Collecting, Research, Exhibitions, and Catalogues.")}
            className="font-serif text-[var(--ink)]"
            zhClassName="block text-[2.2rem] leading-none tracking-[-0.04em] md:text-[3.8rem]"
            enClassName="mt-3 block font-sans text-[0.86rem] uppercase tracking-[0.22em] text-[var(--accent)]"
          />
        </div>
        <div className="space-y-6">
          <p className="text-[0.98rem] leading-8 text-[var(--muted)]">{brandIntro.about.zh}</p>
          <p className="text-[0.98rem] leading-8 text-[var(--muted)]">
            我们不以“海量上新”定义专业，也不将古代艺术处理为泛化的装饰品类。每一次展示、每一件作品与每一段文字，都应指向更准确的观看。
          </p>
          <p className="text-[0.98rem] leading-8 text-[var(--muted)]">
            对竹瑾居而言，品牌并不独立于学术判断之外；网站、展览与图录，本身就是专业工作持续公开的一部分。
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
          {brandIntro.methodology.map((item, index) => (
            <div key={item.zh} className="bg-[var(--surface)] p-7">
              <BilingualText
                as="p"
                text={bt(`方法 ${index + 1}`, `Method ${index + 1}`)}
                className="mb-5 flex flex-col gap-1 text-[var(--accent)]"
                zhClassName="text-[0.72rem] tracking-[0.22em]"
                enClassName="text-[0.54rem] uppercase tracking-[0.24em]"
              />
              <BilingualText
                as="p"
                text={item}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.55rem] leading-snug tracking-[-0.03em]"
                enClassName="hidden"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
          {operationalFacts.map((pillar) => (
            <div key={pillar.title.zh} className="bg-[var(--surface-strong)] p-7">
              <BilingualText
                as="h3"
                text={pillar.title}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.2rem] tracking-[-0.03em]"
                enClassName="mt-2 block font-sans text-[0.64rem] uppercase tracking-[0.22em] text-[var(--accent)]"
              />
              <BilingualText
                as="p"
                text={pillar.value}
                className="mt-4 font-serif text-[var(--ink)]"
                zhClassName="block text-[1.7rem] leading-none tracking-[-0.04em]"
                enClassName="mt-2 block font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]/76"
              />
              <BilingualText
                as="p"
                text={pillar.description}
                className="mt-4 text-[var(--muted)]"
                zhClassName="text-sm leading-7"
                enClassName="hidden"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
