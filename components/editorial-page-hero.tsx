"use client";

import { BilingualText } from "@/components/bilingual-text";
import type { BilingualText as BilingualValue } from "@/lib/site-data";

type EditorialPageHeroProps = {
  eyebrow: BilingualValue;
  title: BilingualValue;
  description: BilingualValue;
  aside?: BilingualValue;
};

export function EditorialPageHero({
  eyebrow,
  title,
  description,
  aside,
}: EditorialPageHeroProps) {
  return (
    <section className="mx-auto w-full max-w-[1480px] px-5 pb-8 pt-9 md:px-8 md:pb-9 md:pt-10 lg:px-10 lg:pb-10 lg:pt-12">
      <div className="border-b border-[var(--line)]/80 pb-8 lg:grid lg:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)] lg:items-end lg:gap-10 lg:pb-10">
        <div className="space-y-4">
          <BilingualText
            as="p"
            text={eyebrow}
            mode="inline"
            className="text-[var(--accent)]"
            zhClassName="text-[0.72rem] tracking-[0.24em]"
            enClassName="text-[0.52rem] uppercase tracking-[0.16em] text-[var(--accent)]/68"
          />
          <BilingualText
            as="h1"
            text={title}
            className="font-serif text-[var(--ink)]"
            zhClassName="block text-[clamp(2.45rem,3.7vw,3.45rem)] leading-[1.03] tracking-[-0.045em]"
            enClassName="mt-3 block text-[0.74rem] uppercase tracking-[0.2em] text-[var(--accent)]/62"
          />
        </div>
        <div className="mt-5 max-w-[30rem] space-y-3 border-t border-[var(--line)]/70 pt-4 lg:mt-0 lg:max-w-[25rem] lg:border-t-0 lg:pt-0">
          <p className="max-w-[27ch] text-[0.94rem] leading-7 text-[var(--muted)]">{description.zh}</p>
          <p className="max-w-[32ch] text-[0.9rem] leading-7 text-[var(--muted)]/88">
            {aside?.zh ?? description.en}
          </p>
        </div>
      </div>
    </section>
  );
}
