import Link from "next/link";

import { ActionLabel } from "@/components/action-label";
import { BilingualText } from "@/components/bilingual-text";
import { ExpandableBilingualCopy } from "@/components/expandable-bilingual-copy";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProtectedImage } from "@/components/protected-image";
import { bt } from "@/lib/bilingual";
import { withImageVersion } from "@/lib/image-url";
import { buildMetadata } from "@/lib/metadata";
import type { ImageAsset } from "@/lib/site-data";
import { getPublicExhibitions, loadSiteContent } from "@/lib/site-data";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("展览与图录", "Exhibitions & Catalogues"),
    description: pageCopy.exhibitions.hero.description,
    path: "/exhibitions",
    site: siteConfig,
  });
}

function ExhibitionCover({
  cover,
  coverAsset,
  title,
}: {
  cover: string;
  coverAsset?: ImageAsset;
  title: { zh: string; en: string };
}) {
  const cardImage = coverAsset?.card ?? cover;
  const isPlaceholder = cardImage.startsWith("/api/placeholder/");

  if (isPlaceholder) {
    return (
      <div className="aspect-[1.18/1]">
        <MediaPlaceholder eyebrow="Exhibition Image" title={title.zh} />
      </div>
    );
  }

  return (
    <ProtectedImage
      src={withImageVersion(cardImage)}
      alt={`${title.zh} ${title.en}`}
      width={1600}
      height={1000}
      quality={84}
      sizes="(min-width: 1024px) 52vw, 100vw"
      wrapperClassName="block"
      className="aspect-[1.18/1] h-full w-full object-cover"
    />
  );
}

export default async function ExhibitionsPage() {
  const content = await loadSiteContent();
  const exhibitions = getPublicExhibitions(content);
  const { pageCopy } = content;
  const cardLabels = pageCopy.exhibitions.cardLabels;

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
          <div className="mt-4 max-w-[26rem] border-t border-[var(--line)]/70 pt-3 lg:mt-0 lg:max-w-[23rem] lg:border-t-0 lg:pt-0">
            <BilingualText
              as="div"
              text={pageCopy.exhibitions.hero.description}
              className="max-w-[25ch] text-[var(--muted)]"
              zhClassName="block text-[0.92rem] leading-7"
              enClassName="mt-2 block text-[0.64rem] uppercase tracking-[0.14em] leading-6 text-[var(--accent)]/64"
            />
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
                <ExhibitionCover
                  cover={exhibition.cover}
                  coverAsset={exhibition.coverAsset}
                  title={exhibition.title}
                />
              </Link>
              <div className="flex flex-col justify-between gap-4">
                <div className="space-y-3.5">
                  {exhibition.subtitle.zh.trim() || exhibition.subtitle.en.trim() ? (
                    <BilingualText
                      as="p"
                      text={exhibition.subtitle}
                      mode="inline"
                      className="text-[var(--accent)]"
                      zhClassName="text-[0.7rem] tracking-[0.2em]"
                      enClassName="text-[0.5rem] uppercase tracking-[0.16em] text-[var(--accent)]/64"
                    />
                  ) : null}
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
                  <ExpandableBilingualCopy
                    text={exhibition.intro}
                    collapsedClassName="max-h-[11rem] md:max-h-[13rem]"
                    zhClassName="max-w-[36ch] text-[0.96rem] leading-[2.02] text-[var(--muted)]"
                    enClassName="max-w-[42ch] text-[0.8rem] leading-[1.78] tracking-[0.02em] text-[var(--accent)]/74"
                  />
                </div>
                <div className="border-t border-[var(--line)]/68 pt-4">
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
