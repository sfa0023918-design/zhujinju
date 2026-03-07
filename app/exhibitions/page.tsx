import Image from "next/image";
import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { PageHero } from "@/components/page-hero";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { exhibitions } from "@/lib/site-data";

export const metadata = buildMetadata({
  title: bt("展览与图录", "Exhibitions & Catalogues"),
  description: bt("查看竹瑾居的展览项目、图录与持续研究输出。", "View Zhu Jin Ju exhibitions, catalogues, and ongoing research output."),
  path: "/exhibitions",
});

export default function ExhibitionsPage() {
  return (
    <>
      <PageHero
        eyebrow={bt("展览与图录", "Exhibitions")}
        title={bt("展览与图录", "Exhibitions & Catalogues")}
        description={bt(
          "持续做展览与图录，不是附加动作，而是竹瑾居专业工作本身。页面将展览项目与图录内容并置，以展示研究输出的连续性。",
          "Exhibitions and catalogues are not supplementary gestures but part of the core practice itself. This page places both together to show continuity in research output."
        )}
        aside={bt(
          "每个展览包含时间、地点、简介与重点作品，便于后续接入真实展览资料与图录下载。",
          "Each exhibition includes dates, venue, summary, and highlighted works, ready for later integration with full documentation and downloads."
        )}
      />

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-14 md:px-10 md:pb-20">
        <div className="grid gap-12">
          {exhibitions.map((exhibition) => (
            <article key={exhibition.slug} className="grid gap-6 border-t border-[var(--line)] pt-6 md:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.48fr)]">
              <Link href={`/exhibitions/${exhibition.slug}`} className="relative overflow-hidden bg-[var(--surface-strong)]">
                <Image
                  src={exhibition.cover}
                  alt={`${exhibition.title.zh} ${exhibition.title.en}`}
                  width={1600}
                  height={1000}
                  unoptimized
                  className="aspect-[1.5/1] h-full w-full object-cover"
                />
              </Link>
              <div className="flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <BilingualText
                    as="p"
                    text={exhibition.subtitle}
                    mode="inline"
                    className="text-[var(--accent)]"
                    zhClassName="text-[0.72rem] tracking-[0.22em]"
                    enClassName="text-[0.5rem] uppercase tracking-[0.18em]"
                  />
                  <div>
                    <BilingualText
                      as="h2"
                      text={exhibition.title}
                      className="font-serif text-[var(--ink)]"
                      zhClassName="block text-[2rem] leading-tight tracking-[-0.04em] md:text-[3.2rem]"
                      enClassName="mt-3 block font-sans text-[0.76rem] uppercase tracking-[0.22em] text-[var(--accent)]"
                    />
                    <div className="mt-3 flex flex-col gap-2 text-sm leading-7 text-[var(--muted)]">
                      <BilingualText as="p" text={exhibition.period} mode="inline" className="block" zhClassName="block" enClassName="text-[0.66rem] text-[var(--accent)]/75" />
                      <BilingualText as="p" text={exhibition.venue} mode="inline" className="block" zhClassName="block" enClassName="text-[0.66rem] text-[var(--accent)]/75" />
                    </div>
                  </div>
                  <BilingualText
                    as="p"
                    text={exhibition.intro}
                    className="text-[var(--muted)] md:text-[0.98rem]"
                    zhClassName="text-sm leading-8"
                    enClassName="hidden"
                  />
                </div>
                <div className="space-y-3 border-t border-[var(--line)] pt-5 text-sm leading-7 text-[var(--muted)]">
                  <BilingualText as="p" text={exhibition.catalogueTitle} mode="inline" className="block" zhClassName="block" enClassName="text-[0.66rem] text-[var(--accent)]/75" />
                  <p>{exhibition.catalogueIntro.zh}</p>
                  <Link href={`/exhibitions/${exhibition.slug}`} className="inline-flex text-[var(--ink)]">
                    <ActionLabel text={bt("查看展览详情", "View Exhibition")} align="start" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
