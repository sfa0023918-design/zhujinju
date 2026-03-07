import Image from "next/image";
import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { ArtworkCard } from "@/components/artwork-card";
import { SectionIntro } from "@/components/section-intro";
import { bt } from "@/lib/bilingual";
import {
  getCurrentExhibition,
  getFeaturedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

export default async function HomePage() {
  const content = await loadSiteContent();
  const { brandIntro, collectingDirections, operationalFacts, pageCopy } = content;
  const currentExhibition = getCurrentExhibition(content);
  const featuredArtworks = getFeaturedArtworks(content);
  const focusCopy = currentExhibition.current ? pageCopy.home.focusCurrent : pageCopy.home.focusRecent;

  return (
    <>
      <section className="mx-auto grid w-full max-w-[1480px] gap-10 px-5 py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] md:px-10 md:py-14">
        <div className="relative overflow-hidden bg-[var(--surface-strong)]">
          <Image
            src={brandIntro.heroImage ?? "/api/placeholder/home-hero?kind=landscape"}
            alt={`${brandIntro.heroAlt?.zh ?? "竹瑾居首页主视觉"} ${brandIntro.heroAlt?.en ?? "Zhu Jin Ju homepage hero"}`}
            width={1600}
            height={1080}
            priority
            unoptimized
            className="aspect-[1.15/1] h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-between gap-8 border-t border-[var(--line)] pt-6 md:pt-0">
          <div className="space-y-5">
            <BilingualText
              as="p"
              text={pageCopy.home.heroEyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.76rem] tracking-[0.18em]"
              enClassName="text-[0.56rem] uppercase tracking-[0.2em] text-[var(--accent)]/80"
            />
            <BilingualText
              as="h1"
              text={pageCopy.home.heroTitle}
              className="font-serif text-[var(--ink)]"
              zhClassName="block max-w-[11ch] text-balance text-[2.9rem] leading-[0.94] tracking-[-0.05em] md:text-[5.9rem]"
              enClassName="mt-4 block font-sans text-[0.68rem] uppercase tracking-[0.22em] text-[var(--accent)]/78 md:text-[0.76rem]"
            />
            <div className="max-w-xl">
              <p className="text-[1rem] leading-8 text-[var(--muted)] md:text-[1.08rem]">
                {brandIntro.statement.zh}
              </p>
              <p className="mt-3 text-[0.74rem] leading-7 text-[var(--accent)]/72 md:text-[0.78rem]">
                {brandIntro.statement.en}
              </p>
            </div>
          </div>
          <div className="grid gap-5 border-t border-[var(--line)] pt-6">
            <div className="max-w-lg">
              <p className="text-sm leading-8 text-[var(--muted)]">{brandIntro.about.zh}</p>
              <p className="mt-3 text-[0.72rem] leading-7 text-[var(--accent)]/72">
                {brandIntro.about.en}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/collection"
                className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-5 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
              >
                <ActionLabel text={pageCopy.home.heroPrimaryAction} />
              </Link>
              <Link
                href="/exhibitions"
                className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                <ActionLabel text={pageCopy.home.heroSecondaryAction} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-10 border-t border-[var(--line)] px-5 py-16 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:px-10 md:py-24">
        <SectionIntro
          eyebrow={focusCopy.eyebrow}
          title={currentExhibition.title}
          description={focusCopy.description}
        />
        <div className="grid gap-6">
          <div className="relative overflow-hidden bg-[var(--surface-strong)]">
            <Image
              src={currentExhibition.cover}
              alt={`${currentExhibition.title.zh} ${currentExhibition.title.en}`}
              width={1600}
              height={1000}
              unoptimized
              className="aspect-[1.45/1] h-full w-full object-cover"
            />
          </div>
          <div className="grid gap-7 border-t border-[var(--line)] pt-7 md:grid-cols-[0.68fr_0.32fr]">
            <BilingualText
              as="p"
              text={currentExhibition.curatorialLead}
              className="text-[var(--muted)] md:text-[0.98rem]"
              zhClassName="text-sm leading-8"
              enClassName="hidden"
            />
            <div className="space-y-3 text-sm leading-7 text-[var(--muted)]">
              <BilingualText
                as="p"
                text={currentExhibition.period}
                mode="inline"
                className="block"
                zhClassName="block"
                enClassName="text-[0.66rem] text-[var(--accent)]/75"
              />
              <BilingualText
                as="p"
                text={currentExhibition.venue}
                mode="inline"
                className="block"
                zhClassName="block"
                enClassName="text-[0.66rem] text-[var(--accent)]/75"
              />
              <p className="text-[0.92rem] text-[var(--muted)]">
                {currentExhibition.highlightCount} {pageCopy.home.focusSummaryLine.highlightUnit.zh} · {currentExhibition.cataloguePages}{" "}
                {pageCopy.home.focusSummaryLine.catalogueUnit.zh}
              </p>
              <Link
                href={`/exhibitions/${currentExhibition.slug}`}
                className="inline-flex pt-3 text-[var(--ink)]"
              >
                <ActionLabel text={pageCopy.home.focusAction} align="start" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-16 md:px-10 md:py-24">
        <SectionIntro
          eyebrow={pageCopy.home.selectedWorks.eyebrow}
          title={pageCopy.home.selectedWorks.title}
          description={pageCopy.home.selectedWorks.description}
        />
        <div className="mt-10 grid gap-8">
          {featuredArtworks.slice(0, 4).map((artwork, index) => (
            <ArtworkCard key={artwork.slug} artwork={artwork} priority={index < 2} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-16 md:px-10 md:py-24">
        <SectionIntro
          eyebrow={pageCopy.home.collectingDirections.eyebrow}
          title={pageCopy.home.collectingDirections.title}
          description={pageCopy.home.collectingDirections.description}
        />
        <div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
          {collectingDirections.map((direction) => (
            <div key={direction.name.zh} className="bg-[var(--surface-strong)] p-7">
              <BilingualText
                as="h3"
                text={direction.name}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.5rem] tracking-[-0.03em]"
                enClassName="mt-2 block font-sans text-[0.66rem] uppercase tracking-[0.22em] text-[var(--accent)]"
              />
              <BilingualText
                as="p"
                text={direction.description}
                className="mt-4 text-[var(--muted)]"
                zhClassName="text-sm leading-7"
                enClassName="hidden"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-16 md:px-10 md:py-24">
        <SectionIntro
          eyebrow={pageCopy.home.operationalFacts.eyebrow}
          title={pageCopy.home.operationalFacts.title}
          description={pageCopy.home.operationalFacts.description}
        />
        <div className="mt-10 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
          {operationalFacts.map((pillar) => (
            <div key={pillar.title.zh} className="bg-[var(--surface)] p-6 md:p-7">
              <BilingualText
                as="h3"
                text={pillar.title}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.2rem] tracking-[-0.03em]"
                enClassName="mt-2 block font-sans text-[0.64rem] uppercase tracking-[0.22em] text-[var(--accent)]"
              />
              <BilingualText
                as="p"
                text={pillar.value}
                className="mt-4 font-serif text-[var(--ink)]"
                zhClassName="block text-[1.75rem] leading-none tracking-[-0.04em]"
                enClassName="mt-2 block font-sans text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]/76"
              />
              <BilingualText
                as="p"
                text={pillar.description}
                className="mt-4 text-[var(--muted)]"
                zhClassName="text-sm leading-7"
                enClassName="hidden"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1480px] gap-8 border-t border-[var(--line)] px-5 py-16 md:grid-cols-[minmax(0,1fr)_340px] md:px-10 md:py-20">
        <div className="space-y-4">
          <BilingualText
            as="p"
            text={pageCopy.home.contact.eyebrow}
            mode="inline"
            className="text-[var(--accent)]"
            zhClassName="text-[0.76rem] tracking-[0.18em]"
            enClassName="text-[0.56rem] uppercase tracking-[0.18em] text-[var(--accent)]/80"
          />
          <BilingualText
            as="h2"
            text={pageCopy.home.contact.title}
            className="font-serif leading-none tracking-[-0.04em]"
            zhClassName="block text-[2.2rem] md:text-[3.8rem]"
            enClassName="mt-3 block font-sans text-[0.86rem] uppercase tracking-[0.24em] text-[var(--accent)]"
          />
          <BilingualText
            as="p"
            text={pageCopy.home.contact.description}
            mode="inline"
            className="max-w-2xl text-[var(--muted)] md:text-[0.98rem]"
            zhClassName="text-sm leading-8"
            enClassName="text-[0.76rem] leading-7 text-[var(--accent)]/75"
          />
        </div>
        <div className="space-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)] md:border-t-0 md:border-l md:pl-8 md:pt-0">
          <Link href="/contact" className="inline-flex text-[var(--ink)]">
            <ActionLabel text={pageCopy.home.contactPrimaryAction} align="start" />
          </Link>
          <Link href="/journal" className="block">
            <ActionLabel text={pageCopy.home.contactSecondaryAction} align="start" />
          </Link>
        </div>
      </section>
    </>
  );
}
