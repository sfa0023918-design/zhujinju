import Image from "next/image";
import Link from "next/link";

import { BilingualText } from "@/components/bilingual-text";
import { ArtworkCard } from "@/components/artwork-card";
import { SectionIntro } from "@/components/section-intro";
import { bt } from "@/lib/bilingual";
import {
  brandIntro,
  collectingDirections,
  currentExhibition,
  featuredArtworks,
  trustPillars,
} from "@/lib/site-data";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] md:px-10 md:py-14">
        <div className="relative overflow-hidden bg-[var(--surface-strong)]">
          <Image
            src="/api/placeholder/home-hero?kind=landscape"
            alt="竹瑾居首页主视觉 Zhu Jin Ju homepage hero"
            width={1600}
            height={1080}
            priority
            unoptimized
            className="aspect-[1.15/1] h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-between gap-8 border-t border-[var(--line)] pt-6 md:pt-0">
          <div className="space-y-5">
            <BilingualText
              as="p"
              text={bt("喜马拉雅艺术与亚洲古代艺术", "Himalayan Art and Asian Antiquities")}
              className="flex flex-col gap-1 text-[var(--accent)]"
              zhClassName="text-[0.76rem] tracking-[0.18em]"
              enClassName="text-[0.62rem] uppercase tracking-[0.24em]"
            />
            <BilingualText
              as="h1"
              text={bt("让作品先说话。", "Let the Work Speak First.")}
              className="max-w-[11ch] text-balance font-serif text-[var(--ink)]"
              zhClassName="block text-[2.9rem] leading-[0.94] tracking-[-0.05em] md:text-[5.9rem]"
              enClassName="mt-4 block font-sans text-[0.85rem] uppercase tracking-[0.24em] text-[var(--accent)] md:text-[0.95rem]"
            />
            <BilingualText
              as="p"
              text={brandIntro.statement}
              className="max-w-xl flex flex-col gap-4 text-[var(--muted)]"
              zhClassName="text-[1rem] leading-8 md:text-[1.08rem]"
              enClassName="text-[0.84rem] leading-7 text-[var(--accent)]/80 md:text-[0.9rem]"
            />
          </div>
          <div className="grid gap-5 border-t border-[var(--line)] pt-6">
            <BilingualText
              as="p"
              text={brandIntro.about}
              className="max-w-lg flex flex-col gap-4 text-[var(--muted)]"
              zhClassName="text-sm leading-8"
              enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
            />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/collection"
                className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-5 text-sm text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
              >
                浏览藏品 / Browse Collection
              </Link>
              <Link
                href="/exhibitions"
                className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-sm text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                查看展览与图录 / View Exhibitions
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:px-10 md:py-20">
        <SectionIntro
          eyebrow={bt("当前专题", "Current Focus")}
          title={currentExhibition.title}
          description={currentExhibition.intro}
        />
        <div className="grid gap-6">
          <div className="relative overflow-hidden bg-[var(--surface-strong)]">
            <Image
              src={currentExhibition.cover}
              alt={`${currentExhibition.title.zh} ${currentExhibition.title.en}`}
              width={1600}
              height={1000}
              unoptimized
              className="aspect-[1.45/1] h-full w-full object-cover"
            />
          </div>
          <div className="grid gap-6 border-t border-[var(--line)] pt-5 md:grid-cols-[0.65fr_0.35fr]">
            <BilingualText
              as="p"
              text={currentExhibition.description[0]}
              className="flex flex-col gap-3 text-[var(--muted)] md:text-[0.98rem]"
              zhClassName="text-sm leading-8"
              enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
            />
            <div className="space-y-4 text-sm leading-7 text-[var(--muted)]">
              <BilingualText
                as="p"
                text={currentExhibition.period}
                className="flex flex-col gap-1"
                zhClassName="block"
                enClassName="block text-[0.74rem] text-[var(--accent)]/80"
              />
              <BilingualText
                as="p"
                text={currentExhibition.venue}
                className="flex flex-col gap-1"
                zhClassName="block"
                enClassName="block text-[0.74rem] text-[var(--accent)]/80"
              />
              <Link
                href={`/exhibitions/${currentExhibition.slug}`}
                className="inline-flex pt-2 text-[var(--ink)]"
              >
                进入专题详情 / View Exhibition
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 py-14 md:px-10 md:py-20">
        <SectionIntro
          eyebrow={bt("精选作品", "Selected Works")}
          title={bt("以作品为核心组织观看顺序", "A Viewing Order Built Around the Object")}
          description={bt(
            "首页优先呈现具有风格代表性与观看张力的作品，页面结构服务于图像与器物本体，而不是服务于冗余装饰。",
            "The homepage foregrounds works of stylistic weight and visual tension, with a structure designed to serve the object rather than decorative excess."
          )}
        />
        <div className="mt-10 grid gap-8">
          {featuredArtworks.slice(0, 4).map((artwork, index) => (
            <ArtworkCard key={artwork.slug} artwork={artwork} priority={index < 2} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <SectionIntro
          eyebrow={bt("收藏方向", "Collecting Directions")}
          title={bt("围绕明确而长期的研究线索展开", "Structured by Clear and Long-Term Research Lines")}
          description={bt(
            "竹瑾居不追求门类堆叠，而是在少数真正重要的方向上持续积累判断、图像档案与展览经验。",
            "Zhu Jin Ju does not pursue breadth for its own sake, but builds judgement, image archives, and exhibition experience within a few important fields."
          )}
        />
        <div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
          {collectingDirections.map((direction) => (
            <div key={direction.name.zh} className="bg-[var(--surface-strong)] p-6">
              <BilingualText
                as="h3"
                text={direction.name}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.5rem] tracking-[-0.03em]"
                enClassName="mt-2 block font-sans text-[0.66rem] uppercase tracking-[0.22em] text-[var(--accent)]"
              />
              <BilingualText
                as="p"
                text={direction.description}
                className="mt-4 flex flex-col gap-3 text-[var(--muted)]"
                zhClassName="text-sm leading-7"
                enClassName="text-[0.78rem] leading-6 text-[var(--accent)]/80"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <SectionIntro
          eyebrow={bt("专业信任", "Professional Trust")}
          title={bt("展览、图录与研究共同构成品牌的方法", "Exhibitions, Catalogues, and Research Form the Method")}
          description={bt(
            "对高净值藏家、机构与研究者而言，可信赖并不来自夸张表达，而来自判断的一致性、信息结构的清晰度与长期积累。",
            "For collectors, institutions, and researchers, trust does not come from emphasis or spectacle, but from consistency of judgement, clarity of information, and long-term work."
          )}
        />
        <div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div key={pillar.title.zh} className="bg-[var(--surface)] p-6 md:p-7">
              <BilingualText
                as="h3"
                text={pillar.title}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.55rem] tracking-[-0.03em]"
                enClassName="mt-2 block font-sans text-[0.64rem] uppercase tracking-[0.22em] text-[var(--accent)]"
              />
              <BilingualText
                as="p"
                text={pillar.description}
                className="mt-4 flex flex-col gap-3 text-[var(--muted)]"
                zhClassName="text-sm leading-7"
                enClassName="text-[0.78rem] leading-6 text-[var(--accent)]/80"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-8 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,1fr)_340px] md:px-10 md:py-18">
        <div className="space-y-4">
          <BilingualText
            as="p"
            text={bt("联系", "Contact")}
            className="flex flex-col gap-1 text-[var(--accent)]"
            zhClassName="text-[0.76rem] tracking-[0.18em]"
            enClassName="text-[0.62rem] uppercase tracking-[0.24em]"
          />
          <BilingualText
            as="h2"
            text={bt("欢迎藏家、机构、策展人与研究者联系。", "Collectors, Institutions, Curators, and Researchers Are Welcome.")}
            className="font-serif leading-none tracking-[-0.04em]"
            zhClassName="block text-[2.2rem] md:text-[3.8rem]"
            enClassName="mt-3 block font-sans text-[0.86rem] uppercase tracking-[0.24em] text-[var(--accent)]"
          />
          <BilingualText
            as="p"
            text={bt(
              "如需咨询具体作品、专题合作、机构借展、图录交换或研究交流，可通过联系页面提交信息。",
              "For inquiries about individual works, collaborations, institutional loans, catalogue exchange, or research discussion, please use the contact page."
            )}
            className="max-w-2xl flex flex-col gap-3 text-[var(--muted)] md:text-[0.98rem]"
            zhClassName="text-sm leading-8"
            enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
          />
        </div>
        <div className="space-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)] md:pt-0">
          <Link href="/contact" className="inline-flex text-[var(--ink)]">
            前往联系页面 / Contact Page
          </Link>
          <Link href="/journal" className="block">
            查看文章与研究 / Read Journal
          </Link>
        </div>
      </section>
    </>
  );
}
