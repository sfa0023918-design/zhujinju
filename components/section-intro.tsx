import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

type SectionIntroProps = {
  eyebrow?: BilingualValue;
  title: BilingualValue;
  description?: BilingualValue;
  className?: string;
};

export function SectionIntro({
  eyebrow,
  title,
  description,
  className = "",
}: SectionIntroProps) {
  return (
    <div className={className}>
      {eyebrow ? (
        <BilingualText
          as="p"
          text={eyebrow}
          mode="inline"
          className="mb-3 text-[var(--accent)]"
          zhClassName="text-[0.78rem] tracking-[0.18em]"
          enClassName="text-[0.62rem] uppercase tracking-[0.22em]"
        />
      ) : null}
      <BilingualText
        as="h2"
        text={title}
        className="max-w-4xl text-balance font-serif text-[var(--ink)]"
        zhClassName="block text-[2.3rem] leading-none tracking-[-0.04em] md:text-[4rem]"
        enClassName="mt-2 block font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent)]/78 md:text-[0.74rem]"
      />
      {description ? (
        <BilingualText
          as="p"
          mode="inline"
          text={description}
          className="mt-5 max-w-2xl text-[var(--muted)]"
          zhClassName="text-base leading-8 md:text-[1.02rem]"
          enClassName="text-[0.76rem] leading-7 text-[var(--accent)]/75 md:text-[0.82rem]"
        />
      ) : null}
    </div>
  );
}
