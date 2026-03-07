import { PageHero } from "@/components/page-hero";
import { buildMetadata } from "@/lib/metadata";
import { brandIntro, trustPillars } from "@/lib/site-data";

export const metadata = buildMetadata({
  title: "关于",
  description: "了解竹瑾居的定位、方法与长期工作的方向。",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="关于竹瑾居"
        description="竹瑾居是一家专注于喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术的品牌，服务对象包括藏家、博物馆、机构、策展人与研究者。"
        aside="我们相信，真正可靠的古代艺术网站，不应以话术主导，而应以判断、结构与节制建立信任。"
      />

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:px-10 md:py-20">
        <div>
          <p className="mb-4 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
            定位
          </p>
          <h2 className="font-serif text-[2.2rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[3.8rem]">
            工作围绕收藏、研究、展览与图录展开。
          </h2>
        </div>
        <div className="rich-text space-y-5 text-[0.98rem]">
          <p>{brandIntro.about}</p>
          <p>
            我们不以“海量上新”定义专业，也不将古代艺术处理为泛化的装饰品类。每一次展示、每一件作品与每一段文字，都应指向更准确的观看。
          </p>
          <p>
            对竹瑾居而言，品牌并不独立于学术判断之外；网站、展览与图录，本身就是专业工作持续公开的一部分。
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
          {brandIntro.methodology.map((item, index) => (
            <div key={item} className="bg-[var(--surface)] p-7">
              <p className="mb-5 text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
                方法 {index + 1}
              </p>
              <p className="font-serif text-[1.55rem] leading-snug tracking-[-0.03em] text-[var(--ink)]">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div key={pillar.title} className="bg-[var(--surface-strong)] p-7">
              <h3 className="font-serif text-[1.5rem] tracking-[-0.03em] text-[var(--ink)]">
                {pillar.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
