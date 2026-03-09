import Image from "next/image";
import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { bt } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { getPublicExhibitions, loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("展览与图录", "Exhibitions & Catalogues"),
    description: pageCopy.exhibitions.hero.description,
    path: "/exhibitions",
    site: siteConfig,
  });
}

function ExhibitionFact({
  label,
  value,
}: {
  label: { zh: string; en: string };
  value: string;
}) {
  return (
    <div className="space-y-2 border-l border-[var(--line)]/70 pl-4 first:border-l-0 first:pl-0 md:min-h-[72px]">
      <BilingualText
        as="p"
        text={label}
        mode="inline"
        className="text-[var(--accent)]"
        zhClassName="text-[11px] tracking-[0.16em]"
        enClassName="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--accent)]/65"
      />
      <p className="text-[0.96rem] leading-7 text-[var(--ink)]">{value}</p>
    </div>
  );
}

function ExhibitionCover({
  cover,
  title,
}: {
  cover: string;
  title: { zh: string; en: string };
}) {
  const isPlaceholder = cover.startsWith("/api/placeholder/");

  if (isPlaceholder) {
    return (
      <div className="aspect-[1.42/1]">
        <MediaPlaceholder eyebrow="Exhibition Image" title={title.zh} />
      </div>
    );
  }

  return (
    <Image
      src={cover}
      alt={`${title.zh} ${title.en}`}
      width={1600}
      height={1000}
      unoptimized
      className="aspect-[1.42/1] h-full w-full object-cover"
    />
  );
}

export default async function ExhibitionsPage() {
  const content = await loadSiteContent();
  const exhibitions = getPublicExhibitions(content);
  const { pageCopy } = content;
  const cardLabels = pageCopy.exhibitions.cardLabels;
  const heroAside = pageCopy.exhibitions.hero.aside?.en ?? pageCopy.exhibitions.hero.eyebrow.en;

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 pb-8 pt-9 md:px-8 md:pb-10 md:pt-10 lg:px-10 lg:pb-12 lg:pt-12">
        <div className="border-b border-[var(--line)]/80 pb-8 lg:grid lg:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)] lg:items-end lg:gap-10 lg:pb-10">
          <div className="space-y-4">
            <BilingualText
              as="p"
              text={pageCopy.exhibitions.hero.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.72rem] tracking-[0.24em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.16em] text-[var(--accent)]/68"
            />
            <BilingualText
              as="h1"
              text={pageCopy.exhibitions.hero.title}
              className="font-serif text-[var(--ink)]"
              zhClassName="block text-[clamp(2.6rem,4vw,3.75rem)] leading-[1.02] tracking-[-0.045em]"
              enClassName="mt-3 block text-[0.76rem] uppercase tracking-[0.22em] text-[var(--accent)]/62"
            />
          </div>
          <div className="mt-5 max-w-[30rem] space-y-3 border-t border-[var(--line)]/70 pt-4 lg:mt-0 lg:max-w-[25rem] lg:border-t-0 lg:pt-0">
            <p className="max-w-[25ch] text-[0.95rem] leading-7 text-[var(--muted)]">
              {pageCopy.exhibitions.hero.description.zh}
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]/56">{heroAside}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-9">
          {exhibitions.map((exhibition) => (
            <article
              key={exhibition.slug}
              className="grid gap-5 border-t border-[var(--line)]/85 pt-6 lg:grid-cols-[minmax(0,0.63fr)_minmax(320px,0.37fr)] lg:gap-7"
            >
              <Link href={`/exhibitions/${exhibition.slug}`} className="relative overflow-hidden bg-[var(--surface-strong)]">
                <ExhibitionCover cover={exhibition.cover} title={exhibition.title} />
              </Link>
              <div className="flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <BilingualText
                    as="p"
                    text={exhibition.subtitle}
                    mode="inline"
                    className="text-[var(--accent)]"
                    zhClassName="text-[0.7rem] tracking-[0.2em]"
                    enClassName="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--accent)]/64"
                  />
                  <div>
                    <BilingualText
                      as="h2"
                      text={exhibition.title}
                      className="font-serif text-[var(--ink)]"
                      zhClassName="block text-[clamp(1.72rem,2.4vw,2.7rem)] leading-[1.04] tracking-[-0.04em]"
                      enClassName="mt-2.5 block font-sans text-[0.72rem] uppercase tracking-[0.2em] text-[var(--accent)]/62"
                    />
                    <div className="mt-3 space-y-1.5 text-sm leading-7 text-[var(--muted)]">
                      <BilingualText
                        as="p"
                        text={exhibition.period}
                        mode="inline"
                        className="block"
                        zhClassName="block text-[0.92rem]"
                        enClassName="text-[0.62rem] uppercase tracking-[0.12em] text-[var(--accent)]/64"
                      />
                      <BilingualText
                        as="p"
                        text={exhibition.venue}
                        mode="inline"
                        className="block"
                        zhClassName="block text-[0.92rem]"
                        enClassName="text-[0.62rem] uppercase tracking-[0.12em] text-[var(--accent)]/64"
                      />
                    </div>
                  </div>
                  <BilingualText
                    as="p"
                    text={exhibition.intro}
                    className="max-w-[30ch] text-[var(--muted)]"
                    zhClassName="text-[0.94rem] leading-7"
                    enClassName="hidden"
                  />
                </div>
                <div className="space-y-4 border-t border-[var(--line)]/75 pt-4 text-sm leading-7 text-[var(--muted)]">
                  <div className="grid gap-3 border-y border-[var(--line)]/70 py-3 md:grid-cols-3">
                    <ExhibitionFact
                      label={cardLabels.highlightWorks}
                      value={`${exhibition.highlightCount} 件`}
                    />
                    <ExhibitionFact
                      label={cardLabels.cataloguePages}
                      value={`${exhibition.cataloguePages} 页`}
                    />
                    <ExhibitionFact
                      label={cardLabels.catalogueTitle}
                      value={exhibition.catalogueTitle.zh}
                    />
                  </div>
                  <p className="max-w-[34ch] text-[0.93rem] leading-7 text-[var(--muted)]">
                    {exhibition.curatorialLead.zh}
                  </p>
                  <div className="space-y-2 border-t border-[var(--line)]/65 pt-4">
                    <BilingualText
                      as="p"
                      text={exhibition.catalogueTitle}
                      mode="inline"
                      className="block"
                      zhClassName="block text-[0.9rem] text-[var(--ink)]"
                      enClassName="text-[0.62rem] uppercase tracking-[0.14em] text-[var(--accent)]/62"
                    />
                    <p className="max-w-[34ch] text-[0.9rem] leading-7 text-[var(--muted)]">{exhibition.catalogueIntro.zh}</p>
                  </div>
                  <Link href={`/exhibitions/${exhibition.slug}`} className="inline-flex text-[var(--ink)]">
                    <ActionLabel text={cardLabels.viewAction} align="start" />
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
