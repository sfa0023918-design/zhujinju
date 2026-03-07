type SectionIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
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
        <p className="mb-3 text-[0.72rem] tracking-[0.24em] text-[var(--accent)] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="max-w-4xl text-balance font-serif text-[2.3rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[4rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] md:text-[1.02rem]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
