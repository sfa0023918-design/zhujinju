import Image from "next/image";
import Link from "next/link";

import { ArtworkCard } from "@/components/artwork-card";
import { SectionIntro } from "@/components/section-intro";
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
            alt="竹瑾居首页主视觉"
            width={1600}
            height={1080}
            priority
            unoptimized
            className="aspect-[1.15/1] h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-between gap-8 border-t border-[var(--line)] pt-6 md:pt-0">
          <div className="space-y-5">
            <p className="text-[0.72rem] tracking-[0.24em] text-[var(--accent)] uppercase">
              喜马拉雅艺术与亚洲古代艺术
            </p>
            <h1 className="max-w-[11ch] text-balance font-serif text-[2.9rem] leading-[0.94] tracking-[-0.05em] text-[var(--ink)] md:text-[5.9rem]">
              让作品先说话。
            </h1>
            <p className="max-w-xl text-[1rem] leading-8 text-[var(--muted)] md:text-[1.08rem]">
              {brandIntro.statement}
            </p>
          </div>
          <div className="grid gap-5 border-t border-[var(--line)] pt-6">
            <p className="max-w-lg text-sm leading-8 text-[var(--muted)]">{brandIntro.about}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/collection"
                className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-5 text-sm text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
              >
                浏览藏品
              </Link>
              <Link
                href="/exhibitions"
                className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-sm text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                查看展览与图录
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:px-10 md:py-20">
        <SectionIntro
          eyebrow="当前专题"
          title={currentExhibition.title}
          description={currentExhibition.intro}
        />
        <div className="grid gap-6">
          <div className="relative overflow-hidden bg-[var(--surface-strong)]">
            <Image
              src={currentExhibition.cover}
              alt={currentExhibition.title}
              width={1600}
              height={1000}
              unoptimized
              className="aspect-[1.45/1] h-full w-full object-cover"
            />
          </div>
          <div className="grid gap-6 border-t border-[var(--line)] pt-5 md:grid-cols-[0.65fr_0.35fr]">
            <p className="text-sm leading-8 text-[var(--muted)] md:text-[0.98rem]">
              {currentExhibition.description[0]}
            </p>
            <div className="space-y-3 text-sm leading-7 text-[var(--muted)]">
              <p>{currentExhibition.period}</p>
              <p>{currentExhibition.venue}</p>
              <Link
                href={`/exhibitions/${currentExhibition.slug}`}
                className="inline-flex pt-2 text-[var(--ink)]"
              >
                进入专题详情
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 py-14 md:px-10 md:py-20">
        <SectionIntro
          eyebrow="精选作品"
          title="以作品为核心组织观看顺序"
          description="首页优先呈现具有风格代表性与观看张力的作品，页面结构服务于图像与器物本体，而不是服务于冗余装饰。"
        />
        <div className="mt-10 grid gap-8">
          {featuredArtworks.slice(0, 4).map((artwork, index) => (
            <ArtworkCard key={artwork.slug} artwork={artwork} priority={index < 2} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <SectionIntro
          eyebrow="收藏方向"
          title="围绕明确而长期的研究线索展开"
          description="竹瑾居不追求门类堆叠，而是在少数真正重要的方向上持续积累判断、图像档案与展览经验。"
        />
        <div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
          {collectingDirections.map((direction) => (
            <div key={direction.name} className="bg-[var(--surface-strong)] p-6">
              <h3 className="font-serif text-[1.5rem] tracking-[-0.03em] text-[var(--ink)]">
                {direction.name}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {direction.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <SectionIntro
          eyebrow="专业信任"
          title="展览、图录与研究共同构成品牌的方法"
          description="对高净值藏家、机构与研究者而言，可信赖并不来自夸张表达，而来自判断的一致性、信息结构的清晰度与长期积累。"
        />
        <div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div key={pillar.title} className="bg-[var(--surface)] p-6 md:p-7">
              <h3 className="font-serif text-[1.55rem] tracking-[-0.03em] text-[var(--ink)]">
                {pillar.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-8 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,1fr)_340px] md:px-10 md:py-18">
        <div className="space-y-4">
          <p className="text-[0.72rem] tracking-[0.24em] text-[var(--accent)] uppercase">联系</p>
          <h2 className="font-serif text-[2.2rem] leading-none tracking-[-0.04em] md:text-[3.8rem]">
            欢迎藏家、机构、策展人与研究者联系。
          </h2>
          <p className="max-w-2xl text-sm leading-8 text-[var(--muted)] md:text-[0.98rem]">
            如需咨询具体作品、专题合作、机构借展、图录交换或研究交流，可通过联系页面提交信息。
          </p>
        </div>
        <div className="space-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)] md:pt-0">
          <Link href="/contact" className="inline-flex text-[var(--ink)]">
            前往联系页面
          </Link>
          <Link href="/journal" className="block">
            查看文章与研究
          </Link>
        </div>
      </section>
    </>
  );
}
