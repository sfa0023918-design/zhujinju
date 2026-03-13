import { BilingualText } from "@/components/bilingual-text";
import { BilingualProse } from "@/components/bilingual-prose";
import { EditorialPageHero } from "@/components/editorial-page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getOperationalFacts, loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-dynamic";

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
  const methodEyebrow = bt("方法与判断", "Method & Judgement");

  return (
    <>
      <EditorialPageHero
        eyebrow={siteConfig.about.eyebrow}
        title={siteConfig.about.title}
        description={siteConfig.about.subtitle}
        aside={bt(
          "围绕收藏、研究、展览与图录展开的工作，应在公开表达中保持判断、秩序与节制。",
          "Work structured around collecting, research, exhibitions, and catalogues should remain clear, ordered, and restrained in public form."
        )}
      />

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
          <BilingualProse content={siteConfig.about.body} variant="body" />
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
