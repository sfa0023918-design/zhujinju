import Image from "next/image";
import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { BilingualProse } from "@/components/bilingual-prose";
import { CollectingDirectionsGrid, OperationalFactsGrid } from "@/components/homepage-info-panels";
import { ArtworkCard } from "@/components/artwork-card";
import {
  getCurrentExhibition,
  getFeaturedArtworks,
  loadSiteContent,
} from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await loadSiteContent();
  const { brandIntro, collectingDirections, operationalFacts, homeContent, siteConfig } = content;
  const currentExhibition = getCurrentExhibition(content);
  const featuredArtworks = getFeaturedArtworks(content);
  const focusCopy = currentExhibition?.current ? homeContent.focusCurrent : homeContent.focusRecent;
  const contactItems = [
    { label: "Email", value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
    { label: "WeChat", value: siteConfig.contact.wechat },
    { label: "Phone", value: siteConfig.contact.phone },
    { label: "Instagram", value: siteConfig.contact.instagram },
  ];
  const contactRows = [contactItems.slice(0, 2), contactItems.slice(2, 4)].filter((row) => row.length > 0);

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 py-6 md:px-8 md:py-7 lg:px-10 lg:py-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] lg:items-end lg:gap-10">
          <div className="relative overflow-hidden bg-[var(--surface-strong)]">
            <Image
              src={brandIntro.heroImage ?? "/api/placeholder/home-hero?kind=landscape"}
              alt={`${brandIntro.heroAlt?.zh ?? "竹瑾居首页主视觉"} ${brandIntro.heroAlt?.en ?? "Zhu Jin Ju homepage hero"}`}
              width={1600}
              height={1080}
              priority
              unoptimized
              className="aspect-[1.22/1] h-full w-full object-cover"
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
                <p className="max-w-[32rem] text-[0.88rem] uppercase tracking-[0.18em] text-[var(--accent)]/58 md:text-[clamp(1rem,1.4vw,1.125rem)]">
                  {homeContent.heroSubtitle.en}
                </p>
              </div>
              <p className="max-w-[26ch] text-[1.05rem] leading-[1.95] text-[var(--muted)] md:text-[clamp(1.125rem,1.45vw,1.25rem)]">
                {homeContent.heroSubtitle.zh}
              </p>
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

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-8 md:px-8 md:py-9 lg:px-10 lg:py-10">
        <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,520px)] lg:gap-7">
          <p className="text-[0.76rem] tracking-[0.18em] text-[var(--accent)]">
            品牌简介
            <span className="mx-[0.45em] opacity-40">·</span>
            <span className="text-[0.52rem] uppercase tracking-[0.2em] text-[var(--accent)]/72">
              Introduction
            </span>
          </p>
          <div className="space-y-3">
            <BilingualProse content={siteConfig.homeIntro} variant="body" className="max-w-[30rem]" />
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
                <p className="text-[0.58rem] uppercase tracking-[0.18em] text-[var(--accent)]/58 md:text-[0.64rem]">
                  {currentExhibition.title.en}
                </p>
              </div>
              <div className="grid gap-2 border-y border-[var(--line)] py-3.5 text-[0.92rem] leading-7 text-[var(--muted)]">
                <p>{currentExhibition.period.zh}</p>
                <p>{currentExhibition.venue.zh}</p>
                <p className="text-[0.86rem] text-[var(--accent)]/88">
                  {currentExhibition.highlightCount} 件重点作品 · {currentExhibition.cataloguePages} 页图录
                </p>
              </div>
              <BilingualProse
                content={currentExhibition.curatorialLead}
                variant="secondary"
                className="max-w-[26rem]"
              />
              <Link href={`/exhibitions/${currentExhibition.slug}`} className="inline-flex text-[var(--ink)]">
                <ActionLabel text={homeContent.focusAction} align="start" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(260px,0.58fr)] lg:items-end lg:gap-8">
          <div className="space-y-3">
            <BilingualText
              as="p"
              text={homeContent.selectedWorks.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.76rem] tracking-[0.18em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.2em] text-[var(--accent)]/72"
            />
            <h2 className="max-w-[11ch] font-serif text-[clamp(2.625rem,4.2vw,3.5rem)] leading-[1] tracking-[-0.04em] text-[var(--ink)]">
              {homeContent.selectedWorks.title.zh}
            </h2>
          </div>
          <p className="max-w-[20rem] text-[0.88rem] leading-7 text-[var(--muted)]">
            {homeContent.selectedWorks.description.zh}
          </p>
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

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-12 md:px-8 md:py-14 lg:px-10 lg:py-16">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:items-start">
          <div className="space-y-3">
            <BilingualText
              as="p"
              text={homeContent.collectingDirections.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.76rem] tracking-[0.18em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.2em] text-[var(--accent)]/72"
            />
            <h2 className="font-serif text-[clamp(24px,2.4vw,32px)] leading-[1.08] tracking-[-0.034em] text-[var(--ink)]">
              {homeContent.collectingDirections.title.zh}
            </h2>
          </div>
          <CollectingDirectionsGrid items={collectingDirections} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-12 md:px-8 md:py-14 lg:px-10 lg:py-16">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:items-start">
          <div className="space-y-3">
            <BilingualText
              as="p"
              text={homeContent.operationalFacts.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.76rem] tracking-[0.18em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.2em] text-[var(--accent)]/72"
            />
            <h2 className="font-serif text-[clamp(24px,2.4vw,32px)] leading-[1.08] tracking-[-0.034em] text-[var(--ink)]">
              {homeContent.operationalFacts.title.zh}
            </h2>
          </div>
          <OperationalFactsGrid items={operationalFacts} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-18">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-8">
          <div className="space-y-3.5">
            <BilingualText
              as="p"
              text={homeContent.contact.eyebrow}
              mode="inline"
              className="text-[var(--accent)]"
              zhClassName="text-[0.76rem] tracking-[0.18em]"
              enClassName="text-[0.52rem] uppercase tracking-[0.18em] text-[var(--accent)]/72"
            />
            <h2 className="max-w-[8.2ch] font-serif text-[clamp(24px,2.4vw,32px)] leading-[1.08] tracking-[-0.034em] text-[var(--ink)]">
              {homeContent.contact.title.zh}
            </h2>
            <p className="max-w-[27rem] text-[15px] leading-[1.82] text-[var(--muted)]/88">
              {homeContent.contact.description.zh}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/contact" className="inline-flex text-[var(--ink)]">
                <ActionLabel text={homeContent.contactPrimaryAction} align="start" />
              </Link>
              <Link href="/journal" className="inline-flex text-[var(--muted)] hover:text-[var(--ink)]">
                <ActionLabel text={homeContent.contactSecondaryAction} align="start" />
              </Link>
            </div>
          </div>
          <div className="border-t border-[var(--line)]/75">
            {contactRows.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className={`grid sm:grid-cols-2 ${rowIndex > 0 ? "border-t border-[var(--line)]/70" : ""}`}
              >
                {row.map((item, itemIndex) => (
                  <div
                    key={item.label}
                    className={`px-1 py-3.5 sm:px-4 ${itemIndex > 0 ? "sm:border-l sm:border-[var(--line)]/70" : ""}`}
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]/32">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-2 block text-[0.9rem] leading-7 text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-2 text-[0.9rem] leading-7 text-[var(--ink)]">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div className="border-t border-[var(--line)]/70 px-1 py-3.5 sm:px-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]/32">Appointment</p>
              <p className="mt-2 text-[0.88rem] leading-6.5 text-[var(--ink)]">{siteConfig.contact.address.zh}</p>
              <p className="mt-1.5 text-[15px] leading-[1.8] text-[var(--muted)]/86">{siteConfig.contact.replyWindow.zh}</p>
              <p className="mt-1 text-[15px] leading-[1.8] text-[var(--muted)]/86">{siteConfig.contact.collaborationNote.zh}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
