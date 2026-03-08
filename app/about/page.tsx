import { BilingualText } from "@/components/bilingual-text";
import { PageHero } from "@/components/page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("关于", "About"),
    description: pageCopy.about.hero.description,
    path: "/about",
    site: siteConfig,
  });
}

export default async function AboutPage() {
  const { brandIntro, operationalFacts, pageCopy } = await loadSiteContent();

  return (
    <>
      <PageHero
        eyebrow={pageCopy.about.hero.eyebrow}
        title={pageCopy.about.hero.title}
        description={pageCopy.about.hero.description}
        aside={pageCopy.about.hero.aside}
      />

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-14 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:px-10 md:py-20">
        <div>
          <BilingualText
            as="p"
            text={pageCopy.about.position.eyebrow}
            mode="inline"
            className="mb-4 text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.22em]"
            enClassName="text-[0.5rem] uppercase tracking-[0.18em]"
          />
          <BilingualText
            as="h2"
            text={pageCopy.about.position.title}
            className="font-serif text-[var(--ink)]"
            zhClassName="block text-[2.2rem] leading-none tracking-[-0.04em] md:text-[3.8rem]"
            enClassName="mt-3 block font-sans text-[0.86rem] uppercase tracking-[0.22em] text-[var(--accent)]"
          />
        </div>
        <div className="space-y-6">
          <p className="text-[0.98rem] leading-8 text-[var(--muted)]">{brandIntro.about.zh}</p>
          <p className="text-[0.98rem] leading-8 text-[var(--muted)]">{pageCopy.about.position.paragraphTwo.zh}</p>
          <p className="text-[0.98rem] leading-8 text-[var(--muted)]">{pageCopy.about.position.paragraphThree.zh}</p>
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
