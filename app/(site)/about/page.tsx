import { BilingualText } from "@/components/bilingual-text";
import { ExpandableBilingualCopy } from "@/components/expandable-bilingual-copy";
import { ProtectedImage } from "@/components/protected-image";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getOperationalFacts, loadSiteContent } from "@/lib/site-data";

export async function generateMetadata() {
  const { siteConfig } = await loadSiteContent();

  return buildMetadata({
    title: bt("关于", "About"),
    description: siteConfig.about.body[0],
    path: "/about",
    site: siteConfig,
  });
}

export default async function AboutPage() {
  const content = await loadSiteContent();
  const { siteConfig } = content;
  const operationalFacts = getOperationalFacts(content);
  const methodEyebrow = bt("竹瑾居的理念", "The Philosophy of Zhu Jin Ju");
  const aboutSpaceImage = "/uploads/branding/about-space-entrance-web.jpg";
  const aboutHeroText = bt(
    "竹瑾居创立于2016年，位于中国成都，是一家专注于喜马拉雅艺术的研究与交流空间。我们持续关注喜马拉雅艺术品的历史脉络、文化语境、审美精神与收藏价值，致力于为藏家提供兼具学术视野、审美判断与专业信赖的观察角度。",
    "Founded in 2016 and based in Chengdu, China, Zhu Jin Ju is a space for the research and exchange of Himalayan art. We continue to attend to the historical lineages, cultural contexts, aesthetic spirit, and collecting value of Himalayan works, offering collectors a perspective grounded in scholarship, connoisseurship, and professional trust.",
  );

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 pb-8 pt-9 md:px-8 md:pb-9 md:pt-10 lg:px-10 lg:pb-10 lg:pt-12">
        <div className="border-b border-[var(--line)]/80 pb-8 lg:grid lg:grid-cols-[minmax(220px,0.32fr)_minmax(190px,0.26fr)_minmax(320px,0.42fr)] lg:items-start lg:gap-10 lg:pb-10 xl:grid-cols-[minmax(240px,0.34fr)_minmax(220px,0.24fr)_minmax(340px,0.42fr)]">
          <div className="space-y-4">
            <BilingualText
              as="p"
              text={siteConfig.about.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.24em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.16em] text-[var(--accent)]/68"
            />
            <BilingualText
              as="h1"
              text={siteConfig.about.title}
              className="font-serif text-[var(--ink)]"
              zhClassName="block text-[clamp(2.45rem,3.7vw,3.45rem)] leading-[1.03] tracking-[-0.045em]"
              enClassName="mt-3 block text-[0.74rem] uppercase tracking-[0.2em] text-[var(--accent)]/62"
            />
          </div>
          <div className="mt-6 lg:mt-0">
            <div className="relative mx-auto w-full max-w-[16rem] lg:max-w-[15rem] xl:max-w-[17rem]">
              <ProtectedImage
                src={aboutSpaceImage}
                alt="竹瑾居艺术空间门头"
                width={960}
                height={1409}
                priority
                quality={86}
                sizes="(min-width: 1280px) 272px, (min-width: 1024px) 240px, 70vw"
                wrapperClassName="block"
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
          <div className="mt-5 max-w-[30rem] border-t border-[var(--line)]/70 pt-4 lg:mt-0 lg:max-w-[25rem] lg:border-t-0 lg:pt-0">
            <ExpandableBilingualCopy
              text={aboutHeroText}
              collapsedClassName="max-h-[13.5rem] md:max-h-[16.5rem]"
              zhClassName="text-[0.94rem] leading-7 text-[var(--muted)]"
              enClassName="text-[0.8rem] leading-6 text-[var(--muted)]/82"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-8 border-t border-[var(--line)]/85 px-5 py-12 md:px-8 md:py-14 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:px-10 lg:py-16">
        <div>
          <BilingualText
            as="p"
            text={methodEyebrow}
            mode="inline"
            className="mb-4 text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.22em]"
            enClassName="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--accent)]/64"
          />
          <BilingualText
            as="h2"
            text={siteConfig.about.subtitle}
            className="font-serif text-[var(--ink)]"
            zhClassName="block text-[clamp(2rem,3vw,3.2rem)] leading-[1.04] tracking-[-0.04em]"
            enClassName="mt-2.5 block font-sans text-[0.74rem] uppercase tracking-[0.2em] text-[var(--accent)]/62"
          />
        </div>
        <div className="max-w-[42rem]">
          <ExpandableBilingualCopy
            text={siteConfig.about.body}
            collapsedClassName="max-h-[22rem] md:max-h-[28rem]"
            zhClassName="text-[1rem] leading-[2.08] text-[var(--muted)]"
            enClassName="text-[0.9rem] leading-[1.84] text-[var(--muted)]/90"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)]/85 px-5 py-12 md:px-8 md:py-14 lg:px-10 lg:py-16">
        <div className="grid border-y border-[var(--line)]/75 md:grid-cols-5 md:divide-x md:divide-[var(--line)]/70">
          {operationalFacts.map((pillar) => (
            <div key={pillar.title.zh} className="border-b border-[var(--line)]/70 px-5 py-6 last:border-b-0 md:border-b-0 md:px-6">
              <BilingualText
                as="h3"
                text={pillar.title}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.06rem] tracking-[-0.03em]"
                enClassName="mt-2 block font-sans text-[0.58rem] uppercase tracking-[0.18em] text-[var(--accent)]/62"
              />
              <BilingualText
                as="p"
                text={pillar.value}
                className="mt-4 font-serif text-[var(--ink)]"
                zhClassName="block text-[1.45rem] leading-[1.04] tracking-[-0.04em]"
                enClassName="mt-2 block font-sans text-[0.64rem] uppercase tracking-[0.16em] text-[var(--accent)]/68"
              />
              <BilingualText
                as="p"
                text={pillar.description}
                className="mt-4 text-[var(--muted)]"
                zhClassName="text-[15px] leading-7"
                enClassName="hidden"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
