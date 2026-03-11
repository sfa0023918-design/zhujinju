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
      <div className="aspect-[1.18/1]">
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
      className="aspect-[1.18/1] h-full w-full object-cover"
    />
  );
}

export default async function ExhibitionsPage() {
  const content = await loadSiteContent();
  const exhibitions = getPublicExhibitions(content);
  const { pageCopy } = content;
  const cardLabels = pageCopy.exhibitions.cardLabels;
  const heroAside = pageCopy.exhibitions.hero.aside?.zh ?? pageCopy.exhibitions.hero.description.en;

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 pb-6 pt-8 md:px-8 md:pb-7 md:pt-9 lg:px-10 lg:pb-8 lg:pt-10">
        <div className="border-b border-[var(--line)]/80 pb-6 lg:grid lg:grid-cols-[minmax(0,0.64fr)_minmax(300px,0.36fr)] lg:items-end lg:gap-9 lg:pb-7">
          <div className="space-y-3">
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
              zhClassName="block text-[clamp(2.35rem,3.55vw,3.25rem)] leading-[1.02] tracking-[-0.044em]"
              enClassName="mt-2.5 block text-[0.72rem] uppercase tracking-[0.2em] text-[var(--accent)]/58"
            />
          </div>
          <div className="mt-4 max-w-[26rem] space-y-2 border-t border-[var(--line)]/70 pt-3 lg:mt-0 lg:max-w-[23rem] lg:border-t-0 lg:pt-0">
            <p className="max-w-[23ch] text-[0.92rem] leading-7 text-[var(--muted)]">
              {pageCopy.exhibitions.hero.description.zh}
            </p>
            <p className="max-w-[27ch] text-[0.86rem] leading-6 text-[var(--muted)]/88">{heroAside}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-8">
          {exhibitions.map((exhibition) => (
            <article
              key={exhibition.slug}
              className="grid gap-5 border-t border-[var(--line)]/85 pt-6 lg:grid-cols-[minmax(0,0.54fr)_minmax(360px,0.46fr)] lg:items-start lg:gap-7"
            >
              <Link
                href={`/exhibitions/${exhibition.slug}`}
                className="relative overflow-hidden bg-[var(--surface-strong)]"
              >
                <ExhibitionCover cover={exhibition.cover} title={exhibition.title} />
              </Link>
              <div className="flex flex-col justify-between gap-4">
                <div className="space-y-3.5">
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
                      zhClassName="block max-w-[13ch] text-[clamp(1.56rem,2.15vw,2.35rem)] leading-[1.04] tracking-[-0.04em]"
                      enClassName="mt-2 block font-sans text-[0.68rem] uppercase tracking-[0.18em] text-[var(--accent)]/58"
                    />
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-[var(--line)]/65 py-2 text-[0.82rem] leading-7 text-[var(--muted)]/92">
                      <BilingualText
                        as="span"
                        text={exhibition.period}
                        mode="inline"
                        className="inline-flex"
                        zhClassName="text-[0.86rem]"
                        enClassName="text-[0.58rem] uppercase tracking-[0.12em] text-[var(--accent)]/68"
                      />
                      <span className="h-[10px] w-px bg-[var(--line)]/75" aria-hidden="true" />
                      <BilingualText
                        as="span"
                        text={exhibition.venue}
                        mode="inline"
                        className="inline-flex"
                        zhClassName="text-[0.86rem]"
                        enClassName="text-[0.58rem] uppercase tracking-[0.12em] text-[var(--accent)]/68"
                      />
                    </div>
                  </div>
                  <BilingualText
                    as="p"
                    text={exhibition.intro}
                    className="max-w-[28ch] text-[var(--muted)]"
                    zhClassName="text-[0.9rem] leading-7"
                    enClassName="hidden"
                  />
                </div>
                <div className="space-y-3.5 border-t border-[var(--line)]/68 pt-4 text-sm leading-7 text-[var(--muted)]">
                  <div className="grid gap-3 border-b border-[var(--line)]/65 pb-3 md:grid-cols-3">
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
                  <p className="max-w-[30ch] text-[0.88rem] leading-7 text-[var(--muted)]/92">
                    {exhibition.curatorialLead.zh}
                  </p>
                  <div className="space-y-1.5 border-t border-[var(--line)]/62 pt-3.5">
                    <BilingualText
                      as="p"
                      text={exhibition.catalogueTitle}
                      mode="inline"
                      className="block"
                      zhClassName="block text-[0.86rem] text-[var(--ink)]"
                      enClassName="text-[0.58rem] uppercase tracking-[0.14em] text-[var(--accent)]/64"
                    />
                    <p className="max-w-[30ch] text-[0.86rem] leading-7 text-[var(--muted)]/92">{exhibition.catalogueIntro.zh}</p>
                  </div>
                  <Link href={`/exhibitions/${exhibition.slug}`} className="inline-flex border-t border-[var(--line)]/62 pt-3 text-[var(--ink)]">
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
