type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  aside?: string;
};

export function PageHero({ eyebrow, title, description, aside }: PageHeroProps) {
  return (
    <section className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 py-14 md:grid-cols-[minmax(0,1.1fr)_320px] md:px-10 md:py-20">
      <div>
        {eyebrow ? (
          <p className="mb-4 text-[0.72rem] tracking-[0.24em] text-[var(--accent)] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-5xl text-balance font-serif text-[2.7rem] leading-[0.95] tracking-[-0.05em] text-[var(--ink)] md:text-[5.6rem]">
          {title}
        </h1>
      </div>
      <div className="space-y-5 border-t border-[var(--line)] pt-5 text-[0.97rem] leading-8 text-[var(--muted)] md:border-t-0 md:border-l md:pl-8 md:pt-0">
        <p>{description}</p>
        {aside ? <p>{aside}</p> : null}
      </div>
    </section>
  );
}
