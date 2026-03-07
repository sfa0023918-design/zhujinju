import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

type PageHeroProps = {
  eyebrow?: BilingualValue;
  title: BilingualValue;
  description: BilingualValue;
  aside?: BilingualValue;
};

export function PageHero({ eyebrow, title, description, aside }: PageHeroProps) {
  return (
    <section className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 py-14 md:grid-cols-[minmax(0,1.1fr)_320px] md:px-10 md:py-20">
      <div>
        {eyebrow ? (
          <BilingualText
            as="p"
            text={eyebrow}
            mode="inline"
            className="mb-4 text-[var(--accent)]"
            zhClassName="text-[0.78rem] tracking-[0.18em]"
            enClassName="text-[0.62rem] uppercase tracking-[0.22em]"
          />
        ) : null}
        <BilingualText
          as="h1"
          text={title}
          className="max-w-5xl text-balance font-serif tracking-[-0.05em] text-[var(--ink)]"
          zhClassName="block text-[2.7rem] leading-[0.95] md:text-[5.6rem]"
          enClassName="mt-3 block font-sans text-[0.88rem] uppercase tracking-[0.24em] text-[var(--accent)] md:text-[1rem]"
        />
      </div>
      <div className="space-y-5 border-t border-[var(--line)] pt-5 md:border-t-0 md:border-l md:pl-8 md:pt-0">
        <BilingualText
          as="p"
          text={description}
          mode="inline"
          className="text-[var(--muted)]"
          zhClassName="text-[0.97rem] leading-8"
          enClassName="text-[0.76rem] leading-7 text-[var(--accent)]/75"
        />
        {aside ? (
          <BilingualText
            as="p"
            text={aside}
            mode="inline"
            className="text-[var(--muted)]"
            zhClassName="text-[0.94rem] leading-8"
            enClassName="text-[0.74rem] leading-7 text-[var(--accent)]/75"
          />
        ) : null}
      </div>
    </section>
  );
}
