import Image from "next/image";
import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { ArtworkCard } from "@/components/artwork-card";
import {
  getCurrentExhibition,
  getFeaturedArtworks,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";

export const dynamic = "force-dynamic";

function getExhibitionYear(period: string) {
  const match = period.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? period.split(/[.\-/]/)[0]?.trim() ?? "";
}

export default async function HomePage() {
  const content = await loadSiteContent();
  const { brandIntro, homeContent } = content;
  const currentExhibition = getCurrentExhibition(content);
  const featuredArtworks = getFeaturedArtworks(content);
  const exhibitionCatalogueItems = getPublicExhibitions(content).slice(0, 3);
  const singleExhibition = exhibitionCatalogueItems.length === 1 ? exhibitionCatalogueItems[0] : null;
  const exhibitionArchiveCopy = {
    eyebrow: { zh: "展览", en: "Exhibitions" },
    title: { zh: "展览记录", en: "Exhibition Archive" },
  };
  const focusCopy = currentExhibition?.current ? homeContent.focusCurrent : homeContent.focusRecent;

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 py-6 md:px-8 md:py-7 lg:px-10 lg:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.22fr)_minmax(300px,0.78fr)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1.26fr)_minmax(320px,0.74fr)]">
          <div className="relative self-start overflow-hidden bg-[var(--surface-strong)]">
            <Image
              src={brandIntro.heroImage ?? "/api/placeholder/home-hero?kind=landscape"}
              alt={`${brandIntro.heroAlt?.zh ?? "竹瑾居首页主视觉"} ${brandIntro.heroAlt?.en ?? "Zhu Jin Ju homepage hero"}`}
              width={1600}
              height={1080}
              priority
              unoptimized
              className="aspect-[1.28/1] w-full object-cover md:aspect-[1.4/1] lg:aspect-[1.58/1] xl:aspect-[1.68/1]"
            />
          </div>
          <div className="flex flex-col justify-end gap-6 lg:pb-1">
            <div className="space-y-4">
              <BilingualText
                as="p"
                text={homeContent.heroEyebrow}
                mode="inline"
                className="text-[var(--accent)]"
                zhClassName="text-[0.72rem] tracking-[0.18em]"
                enClassName="text-[0.48rem] uppercase tracking-[0.2em] text-[var(--accent)]/66"
              />
              <div className="space-y-3">
                <h1 className="max-w-[9ch] font-serif text-[clamp(3.625rem,6vw,4.875rem)] leading-[0.98] tracking-[-0.05em] text-[var(--ink)]">
                  {homeContent.heroTitle.zh}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-5">
              <Link
                href="/collection"
                className="inline-flex min-h-12 items-center border border-[var(--line-strong)] px-4.5 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
              >
                <ActionLabel text={homeContent.heroPrimaryAction} />
              </Link>
              <Link
                href="/exhibitions"
                className="inline-flex min-h-12 items-center border border-[var(--line)] px-4.5 text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              >
                <ActionLabel text={homeContent.heroSecondaryAction} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {currentExhibition ? (
        <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.76fr)] lg:items-start lg:gap-10">
            <div className="relative overflow-hidden bg-[var(--surface-strong)]">
              <Image
                src={currentExhibition.cover}
                alt={`${currentExhibition.title.zh} ${currentExhibition.title.en}`}
                width={1600}
                height={1000}
                unoptimized
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
              <Link href={`/exhibitions/${currentExhibition.slug}`} className="inline-flex text-[var(--ink)]">
                <ActionLabel text={homeContent.focusAction} align="start" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(260px,0.58fr)] lg:items-end lg:gap-8">
          <div className="space-y-2">
            <h2 className="font-serif text-[clamp(2rem,3vw,2.5rem)] leading-[1.02] tracking-[-0.035em] text-[var(--ink)]">
              {homeContent.selectedWorks.eyebrow.zh}
            </h2>
            <p className="text-[0.58rem] uppercase tracking-[0.18em] text-[var(--accent)]/64 md:text-[0.62rem]">
              {homeContent.selectedWorks.eyebrow.en}
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

      {exhibitionCatalogueItems.length ? (
        <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
          <div className="space-y-3">
            <BilingualText
              as="p"
              text={exhibitionArchiveCopy.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.76rem] tracking-[0.18em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.2em] text-[var(--accent)]/72"
            />
            <h2 className="font-serif text-[clamp(2.4rem,4vw,3.3rem)] leading-[1] tracking-[-0.04em] text-[var(--ink)]">
              {exhibitionArchiveCopy.title.zh}
            </h2>
          </div>
          {singleExhibition ? (
            <div className="mt-7 max-w-[980px]">
              <Link
                href={`/exhibitions/${singleExhibition.slug}`}
                className="group grid gap-3 md:grid-cols-[minmax(0,0.94fr)_minmax(220px,0.34fr)] md:items-start md:gap-5"
              >
                <div className="relative max-w-[860px] overflow-hidden bg-[var(--surface-strong)]">
                  <Image
                    src={singleExhibition.cover}
                    alt={`${singleExhibition.title.zh} ${singleExhibition.title.en}`}
                    width={1200}
                    height={1200}
                    unoptimized
                    priority
                    className="aspect-[1.06/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                  />
                </div>
                <div className="space-y-1.5 pt-0.5 md:max-w-[220px] md:pt-1">
                  <p className="font-serif text-[1.06rem] leading-[1.45] text-[var(--ink)]">
                    {singleExhibition.title.zh}
                  </p>
                  <p className="text-[0.72rem] tracking-[0.12em] text-[var(--accent)]/76">
                    {getExhibitionYear(singleExhibition.period.zh || singleExhibition.period.en)}
                    <span className="px-2 text-[var(--accent)]/38">·</span>
                    {singleExhibition.venue.zh || singleExhibition.venue.en}
                  </p>
                </div>
              </Link>
            </div>
          ) : (
            <div className="mt-9 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {exhibitionCatalogueItems.map((item, index) => (
                <Link key={item.slug} href={`/exhibitions/${item.slug}`} className="group block">
                  <div className="relative overflow-hidden bg-[var(--surface-strong)]">
                    <Image
                      src={item.cover}
                      alt={`${item.title.zh} ${item.title.en}`}
                      width={1200}
                      height={1200}
                      unoptimized
                      className="aspect-[1.06/1] w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                      priority={index === 0}
                    />
                  </div>
                  <div className="space-y-1.5 pt-3.5">
                    <p className="font-serif text-[1.06rem] leading-[1.45] text-[var(--ink)]">{item.title.zh}</p>
                    <p className="text-[0.72rem] tracking-[0.12em] text-[var(--accent)]/76">
                      {getExhibitionYear(item.period.zh || item.period.en)}
                      <span className="px-2 text-[var(--accent)]/38">·</span>
                      {item.venue.zh || item.venue.en}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}

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
