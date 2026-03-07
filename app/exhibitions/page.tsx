import Image from "next/image";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { buildMetadata } from "@/lib/metadata";
import { exhibitions } from "@/lib/site-data";

export const metadata = buildMetadata({
  title: "展览与图录",
  description: "查看竹瑾居的展览项目、图录与持续研究输出。",
  path: "/exhibitions",
});

export default function ExhibitionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Exhibitions"
        title="展览与图录"
        description="持续做展览与图录，不是附加动作，而是竹瑾居专业工作本身。页面将展览项目与图录内容并置，以展示研究输出的连续性。"
        aside="每个展览包含时间、地点、简介与重点作品，便于后续接入真实展览资料与图录下载。"
      />

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-14 md:px-10 md:pb-20">
        <div className="grid gap-12">
          {exhibitions.map((exhibition) => (
            <article key={exhibition.slug} className="grid gap-6 border-t border-[var(--line)] pt-6 md:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.48fr)]">
              <Link href={`/exhibitions/${exhibition.slug}`} className="relative overflow-hidden bg-[var(--surface-strong)]">
                <Image
                  src={exhibition.cover}
                  alt={exhibition.title}
                  width={1600}
                  height={1000}
                  unoptimized
                  className="aspect-[1.5/1] h-full w-full object-cover"
                />
              </Link>
              <div className="flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <p className="text-[0.72rem] tracking-[0.22em] text-[var(--accent)] uppercase">
                    {exhibition.subtitle}
                  </p>
                  <div>
                    <h2 className="font-serif text-[2rem] leading-tight tracking-[-0.04em] text-[var(--ink)] md:text-[3.2rem]">
                      {exhibition.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      {exhibition.period} · {exhibition.venue}
                    </p>
                  </div>
                  <p className="text-sm leading-8 text-[var(--muted)] md:text-[0.98rem]">
                    {exhibition.intro}
                  </p>
                </div>
                <div className="space-y-3 border-t border-[var(--line)] pt-5 text-sm leading-7 text-[var(--muted)]">
                  <p>{exhibition.catalogueTitle}</p>
                  <p>{exhibition.catalogueIntro}</p>
                  <Link href={`/exhibitions/${exhibition.slug}`} className="inline-flex text-[var(--ink)]">
                    查看展览详情
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
