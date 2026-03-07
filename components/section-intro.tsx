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
          className="mb-3 flex flex-col gap-1 text-[var(--accent)]"
          zhClassName="text-[0.78rem] tracking-[0.18em]"
          enClassName="text-[0.68rem] uppercase tracking-[0.24em]"
        />
      ) : null}
      <BilingualText
        as="h2"
        text={title}
        className="max-w-4xl text-balance font-serif text-[var(--ink)]"
        zhClassName="block text-[2.3rem] leading-none tracking-[-0.04em] md:text-[4rem]"
        enClassName="mt-3 block font-sans text-[0.85rem] uppercase tracking-[0.24em] text-[var(--accent)] md:text-[0.95rem]"
      />
      {description ? (
        <BilingualText
          as="p"
          text={description}
          className="mt-5 max-w-2xl flex flex-col gap-3 text-[var(--muted)]"
          zhClassName="text-base leading-8 md:text-[1.02rem]"
          enClassName="text-[0.82rem] leading-7 text-[var(--accent)]/80 md:text-[0.88rem]"
        />
      ) : null}
    </div>
  );
}
