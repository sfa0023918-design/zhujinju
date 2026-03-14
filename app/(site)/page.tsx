import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { ArtworkCard } from "@/components/artwork-card";
import { ProtectedImage } from "@/components/protected-image";
import {
  getCurrentExhibition,
  getFeaturedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

export default async function HomePage() {
  const content = await loadSiteContent();
  const { brandIntro, homeContent } = content;
  const currentExhibition = getCurrentExhibition(content);
  const currentExhibitionImage = currentExhibition
    ? currentExhibition.coverAsset?.card ?? currentExhibition.cover
    : "";
  const featuredArtworks = getFeaturedArtworks(content);
  const focusCopy = currentExhibition?.current ? homeContent.focusCurrent : homeContent.focusRecent;
  const archiveEntryCopy = { zh: "往期展览", en: "Exhibition Archive" };
  const worksSectionCopy = { zh: "部分藏品赏析", en: "Selected Highlights" };

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 py-8 md:px-8 md:py-9 lg:px-10 lg:py-11">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.38fr)_minmax(280px,0.52fr)] lg:items-end lg:gap-12 xl:grid-cols-[minmax(0,1.44fr)_minmax(320px,0.48fr)]">
          <div className="relative self-start overflow-hidden bg-[var(--surface-strong)]">
            <ProtectedImage
              src={brandIntro.heroImage ?? "/api/placeholder/home-hero?kind=landscape"}
              alt={`${brandIntro.heroAlt?.zh ?? "竹瑾居首页主视觉"} ${brandIntro.heroAlt?.en ?? "Zhu Jin Ju homepage hero"}`}
              width={1600}
              height={1080}
              priority
              quality={85}
              sizes="(min-width: 1280px) 60vw, (min-width: 1024px) 58vw, 100vw"
              wrapperClassName="block"
              className="aspect-[1.08/1] w-full object-cover md:aspect-[1.18/1] lg:aspect-[1.24/1] xl:aspect-[1.3/1]"
            />
          </div>
          <div className="flex max-w-[22rem] flex-col justify-end gap-8 lg:pb-2">
            <div className="space-y-5">
              <BilingualText
                as="p"
                text={homeContent.heroEyebrow}
                mode="inline"
                className="text-[var(--accent)]"
                zhClassName="text-[0.68rem] tracking-[0.2em]"
                enClassName="text-[0.46rem] uppercase tracking-[0.22em] text-[var(--accent)]/66"
              />
              <div className="space-y-3.5">
                <h1 className="max-w-[7ch] font-serif text-[clamp(3.2rem,5.2vw,4.35rem)] leading-[0.96] tracking-[-0.05em] text-[var(--ink)]">
                  {homeContent.heroTitle.zh}
                </h1>
                <p className="text-[0.56rem] uppercase tracking-[0.2em] text-[var(--accent)]/72">
                  {homeContent.heroTitle.en}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--line)] pt-5">
              <Link
                href="/collection"
                className="inline-flex text-[var(--ink)]"
              >
                <ActionLabel text={homeContent.heroPrimaryAction} align="start" />
              </Link>
              <Link
                href="/exhibitions"
                className="inline-flex text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <ActionLabel text={homeContent.heroSecondaryAction} align="start" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {currentExhibition ? (
        <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.76fr)] lg:items-start lg:gap-10">
            <div className="relative overflow-hidden bg-[var(--surface-strong)]">
              <ProtectedImage
                src={currentExhibitionImage}
                alt={`${currentExhibition.title.zh} ${currentExhibition.title.en}`}
                width={1600}
                height={1000}
                quality={84}
                sizes="(min-width: 1280px) 52vw, (min-width: 1024px) 50vw, 100vw"
                wrapperClassName="block"
                className="aspect-[1.42/1] h-full w-full object-cover"
              />
            </div>
            <div className="space-y-5 md:pt-3">
              <BilingualText
                as="p"
                text={focusCopy.eyebrow}
                mode="inline"
                className="text-[var(--accent)]"
                zhClassName="text-[0.72rem] tracking-[0.18em]"
                enClassName="text-[0.48rem] uppercase tracking-[0.18em] text-[var(--accent)]/64"
              />
              <div className="space-y-2.5">
                <p className="font-serif text-[clamp(2.56rem,4.45vw,3.56rem)] leading-[0.98] tracking-[-0.04em] text-[var(--ink)]">
                  {currentExhibition.title.zh}
                </p>
              </div>
              <div className="grid gap-2 border-y border-[var(--line)] py-3.5 text-[0.92rem] leading-7 text-[var(--muted)]">
                <p>{currentExhibition.period.zh}</p>
                <p>{currentExhibition.venue.zh}</p>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                <Link href={`/exhibitions/${currentExhibition.slug}`} className="inline-flex text-[var(--ink)]">
                  <ActionLabel text={homeContent.focusAction} align="start" />
                </Link>
                <Link href="/exhibitions" className="inline-flex text-[var(--muted)] hover:text-[var(--ink)]">
                  <ActionLabel text={archiveEntryCopy} align="start" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(260px,0.58fr)] lg:items-end lg:gap-8">
          <div className="space-y-2">
            <h2 className="font-serif text-[clamp(2rem,3vw,2.5rem)] leading-[1.02] tracking-[-0.035em] text-[var(--ink)]">
              {worksSectionCopy.zh}
            </h2>
            <p className="text-[0.58rem] uppercase tracking-[0.18em] text-[var(--accent)]/64 md:text-[0.62rem]">
              {worksSectionCopy.en}
            </p>
          </div>
        </div>
        <div className="mt-9 grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
          {featuredArtworks.slice(0, 4).map((artwork, index) => (
            <ArtworkCard
              key={artwork.slug}
              artwork={artwork}
              priority={index < 2}
              variant="compact"
            />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-10 md:px-8 md:py-11 lg:px-10 lg:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BilingualText
              as="p"
              text={homeContent.contact.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.76rem] tracking-[0.18em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.18em] text-[var(--accent)]/72"
            />
          </div>
          <Link href="/contact" className="inline-flex text-[var(--ink)]">
            <ActionLabel text={homeContent.contactPrimaryAction} align="start" />
          </Link>
        </div>
      </section>
    </>
  );
}
