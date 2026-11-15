"use client";

import Link from "next/link";
import type {
  Article,
  Artwork,
  Exhibition,
  PageCopyContent,
  SiteConfigContent,
  BilingualText as BilingualValue,
} from "@/lib/site-data";
import { getArtworkStatusText } from "@/lib/bilingual";
import type { ArtworkCatalogueReference } from "@/lib/data/catalogue-pages";
import { cataloguePageGeometry } from "@/lib/catalogue-media";
import {
  COVER_VAJRA_IMAGE,
  COVER_VAJRA_SLUG,
} from "@/lib/artwork-presentation";
import {
  resolveArtworkPrimaryImage,
  resolveArtworkPrimaryImageCandidates,
} from "@/lib/image-url";
import { ArtworkGrid } from "./artwork-grid";
import { ArtworkGallery } from "./artwork-gallery";
import { ArtworkSectionNav } from "./artwork-section-nav";
import { ContemporaryReading } from "./contemporary-reading";
import { ProtectedImage } from "./protected-image";
import styles from "./artwork-detail.module.css";

type Props = {
  artwork: Artwork;
  detailCopy: PageCopyContent["artworkDetail"];
  siteConfig: SiteConfigContent;
  relatedWorks: Artwork[];
  relatedArticles: Article[];
  relatedExhibitions: Exhibition[];
  catalogue?: ArtworkCatalogueReference;
};
function hasText(value?: { zh?: string; en?: string } | null) {
  if (!value) {
    return false;
  }

  return Boolean(value.zh?.trim() || value.en?.trim());
}

function joinBilingual(
  primary: { zh: string; en: string },
  secondary?: { zh: string; en: string },
) {
  if (!secondary || (!secondary.zh.trim() && !secondary.en.trim())) {
    return primary;
  }

  return {
    zh: `${primary.zh} · ${secondary.zh}`,
    en: `${primary.en} · ${secondary.en}`,
  };
}

function Pair({
  text,
  className = "",
}: {
  text: BilingualValue;
  className?: string;
}) {
  return (
    <div className={className}>
      {text.zh ? <p>{text.zh}</p> : null}
      {text.en && text.en !== text.zh ? <p lang="en">{text.en}</p> : null}
    </div>
  );
}

export function ArtworkDetailTemplate({
  artwork,
  detailCopy,
  relatedWorks,
  relatedArticles,
  relatedExhibitions,
  catalogue,
}: Props) {
  const isVajra = artwork.slug === COVER_VAJRA_SLUG;
  const status = getArtworkStatusText(artwork.status);
  // Some records use the title as a placeholder summary. Keep unique copy,
  // but do not repeat the heading as a second paragraph in either language.
  const excerpt = {
    zh:
      artwork.excerpt.zh.trim() === artwork.title.zh.trim()
        ? ""
        : artwork.excerpt.zh,
    en:
      artwork.excerpt.en.trim() === artwork.title.en.trim()
        ? ""
        : artwork.excerpt.en,
  };
  const facts = [
    { key: "period", label: detailCopy.fieldLabels.period, value: artwork.period },
    {
      key: "region",
      label: detailCopy.fieldLabels.regionOrigin,
      value: joinBilingual(artwork.region, artwork.origin),
    },
    { key: "material", label: detailCopy.fieldLabels.material, value: artwork.material },
    ...(hasText(artwork.technique)
      ? [{ key: "technique", label: { zh: "工艺", en: "Technique" }, value: artwork.technique! }]
      : []),
    { key: "dimensions", label: detailCopy.fieldLabels.dimensions, value: artwork.dimensions },
    { key: "status", label: { zh: "状态", en: "Status" }, value: status },
  ].filter((item) => hasText(item.value));
  const inquiryHref = `/contact?artwork=${encodeURIComponent(`${artwork.title.zh} / ${artwork.title.en}`)}`;
  const viewingNote = artwork.viewingNote;
  const sections = [
    { id: "artwork-info", label: { zh: "作品信息", en: "Artwork Info" } },
    ...(hasText(viewingNote) || hasText(artwork.comparisonNote)
      ? [
          {
            id: "artwork-viewing",
            label: { zh: "观看描述", en: "Visual Description" },
          },
        ]
      : []),
    ...(artwork.provenance.length
      ? [{ id: "artwork-provenance", label: detailCopy.provenance }]
      : []),
    ...(artwork.exhibitions.length
      ? [{ id: "artwork-exhibitions", label: detailCopy.exhibitions }]
      : []),
    ...(artwork.publications.length
      ? [{ id: "artwork-publications", label: detailCopy.publications }]
      : []),
    ...(relatedArticles.length
      ? [{ id: "artwork-related-articles", label: detailCopy.relatedArticles }]
      : []),
  ];
  return (
    <article className={styles.artworkDetail}>
      <ArtworkGallery
        title={`${artwork.title.zh} ${artwork.title.en}`}
        primaryImage={
          isVajra ? COVER_VAJRA_IMAGE : resolveArtworkPrimaryImage(artwork)
        }
        primaryImageCandidates={resolveArtworkPrimaryImageCandidates(artwork)}
        width={isVajra ? 900 : (artwork.imageAsset?.width ?? 800)}
        height={isVajra ? 1198 : (artwork.imageAsset?.height ?? 1000)}
        gallery={artwork.gallery}
        galleryAssets={artwork.galleryAssets}
        backLabel={detailCopy.backAction}
      >
        <div className={styles.recordHeading}>
          <p className={styles.category}>
            {artwork.category.zh}
            <span lang="en">{artwork.category.en}</span>
          </p>
          <div className={styles.titleGroup}>
            <h1>{artwork.title.zh}</h1>
            <p lang="en">{artwork.title.en}</p>
          </div>
          {hasText(excerpt) ? (
            <Pair text={excerpt} className={styles.excerpt} />
          ) : null}
        </div>
        <div className={styles.recordFacts}>
          <dl className={styles.facts}>
            {facts.map(({ key, label, value }) => (
              <div key={key} data-fact={key}>
                <dt>
                  {label.zh}
                  <span lang="en">{label.en}</span>
                </dt>
                <dd data-artwork-status={key === "status" ? artwork.status : undefined}>
                  {value.zh}
                  {value.en && value.en !== value.zh ? (
                    <span lang="en">{value.en}</span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
          <div className={styles.inquiry} data-status={artwork.status}>
            {artwork.status === "sold" ? (
              <div className={styles.inquiryAction} data-artwork-status="sold">
                {status.zh}
                <span lang="en">{status.en}</span>
              </div>
            ) : (
              <Link href={inquiryHref} className={styles.inquiryAction}>
                {detailCopy.inquireAction.zh}
                <span lang="en">{detailCopy.inquireAction.en}</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
            {artwork.status !== "sold" ? (
              <ul className={styles.inquirySupport}>
                {artwork.inquirySupport.filter(hasText).map((item) => (
                  <li key={item.zh || item.en}>
                    <Link
                      href={`${inquiryHref}&request=${encodeURIComponent(item.zh || item.en)}`}
                    >
                      {item.zh || item.en}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </ArtworkGallery>
      <ArtworkSectionNav sections={sections} />
      {hasText(viewingNote) ? (
        <ContemporaryReading
          id="artwork-viewing"
          title={detailCopy.viewingNote}
          content={viewingNote}
        />
      ) : null}
      {hasText(artwork.comparisonNote) ? (
        <ContemporaryReading
          id={hasText(viewingNote) ? "artwork-comparison" : "artwork-viewing"}
          title={detailCopy.comparisonNote}
          content={artwork.comparisonNote}
        />
      ) : null}
      {artwork.provenance.length ||
      artwork.exhibitions.length ||
      artwork.publications.length ? (
        <section className={styles.records}>
          <div className={styles.recordsGrid}>
            {artwork.provenance.length ? (
              <section id="artwork-provenance">
                <h2>
                  {detailCopy.provenance.zh}
                  <span lang="en">{detailCopy.provenance.en}</span>
                </h2>
                <ul>
                  {artwork.provenance.map((item, i) => (
                    <li key={i}>
                      <Pair text={item.label} />
                      {item.note && hasText(item.note) ? (
                        <Pair text={item.note} className={styles.recordNote} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {artwork.exhibitions.length ? (
              <section id="artwork-exhibitions">
                <h2>
                  {detailCopy.exhibitions.zh}
                  <span lang="en">{detailCopy.exhibitions.en}</span>
                </h2>
                <ul>
                  {artwork.exhibitions.map((item, i) => (
                    <li key={i}>
                      <Pair text={item.title} />
                      <Pair text={item.venue} className={styles.recordNote} />
                      <p className={styles.recordNote}>{item.year}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {artwork.publications.length ? (
              <section id="artwork-publications">
                <h2>
                  {detailCopy.publications.zh}
                  <span lang="en">{detailCopy.publications.en}</span>
                </h2>
                <ul>
                  {artwork.publications.map((item, i) => (
                    <li key={i}>
                      <Pair text={item.title} />
                      <p className={styles.recordNote}>{item.year}</p>
                      <Pair text={item.pages} className={styles.recordNote} />
                      {item.note && hasText(item.note) ? (
                        <Pair text={item.note} className={styles.recordNote} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </section>
      ) : null}
      {relatedArticles.length || relatedExhibitions.length ? (
        <div className={styles.relatedReferences}>
          {relatedExhibitions.length ? (
            <section>
              <h2>
                {detailCopy.relatedExhibitions.zh}{" "}
                <span lang="en">{detailCopy.relatedExhibitions.en}</span>
              </h2>
              {relatedExhibitions.map((item) => (
                <Link key={item.slug} href={`/exhibitions/${item.slug}`}>
                  <Pair text={item.title} />
                </Link>
              ))}
            </section>
          ) : null}
          {relatedArticles.length ? (
            <section id="artwork-related-articles">
              <h2>
                {detailCopy.relatedArticles.zh}{" "}
                <span lang="en">{detailCopy.relatedArticles.en}</span>
              </h2>
              {relatedArticles.map((item) => (
                <Link key={item.slug} href={`/journal/${item.slug}`}>
                  <Pair text={item.title} />
                </Link>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
      {catalogue ? (
        <section
          className={styles.catalogue}
          aria-label="图录中的这件作品 / In the Catalogue"
        >
          <div className={styles.catalogueGrid}>
            <div>
              <p className={styles.category}>
                图录中的这件作品 <span lang="en">In the Catalogue</span>
              </p>
              <Pair text={catalogue.title} className={styles.catalogueTitle} />
              <p className={styles.cataloguePages}>
                第 {catalogue.pages[0]}
                {catalogue.pages[1] !== catalogue.pages[0]
                  ? `–${catalogue.pages[1]}`
                  : ""}{" "}
                页 · {catalogue.pages[1] !== catalogue.pages[0] ? "pp." : "p."}{" "}
                {catalogue.pages[0]}
                {catalogue.pages[1] !== catalogue.pages[0]
                  ? `–${catalogue.pages[1]}`
                  : ""}
              </p>
              {/* Use document navigation for catalogue deep links so WebKit does
                  not stall this entry while client-route styles are preloaded. */}
              <a href={catalogue.href} className={styles.catalogueLink}>
                翻到此页阅读 <span lang="en">Open at this page</span> →
              </a>
            </div>
            <a
              href={catalogue.href}
              className={styles.cataloguePreview}
              data-paired={catalogue.images.length > 1}
              aria-label={`${artwork.title.zh}：翻到图录此页阅读 / Open catalogue at this work`}
            >
              {catalogue.images.map((src, index) => {
                const geometry = cataloguePageGeometry(
                  src,
                  catalogue.images.length === 1,
                );
                return (
                  <ProtectedImage
                    key={src}
                    src={src}
                    alt={`${catalogue.title.zh}，${artwork.title.zh}${catalogue.images.length > 1 ? (index === 0 ? "（左页）" : "（右页）") : ""}`}
                    width={geometry.width}
                    height={geometry.height}
                    sizes={
                      catalogue.images.length > 1
                        ? "(max-width: 860px) 50vw, 37vw"
                        : "(max-width: 860px) 100vw, 75vw"
                    }
                    className={styles.catalogueImage}
                    wrapperClassName={styles.catalogueImageFrame}
                  />
                );
              })}
            </a>
          </div>
        </section>
      ) : null}
      {relatedWorks.length ? (
        <section className={styles.relatedWorks}>
          <div className={styles.relatedHeading}>
            <h2>
              {detailCopy.relatedWorksTitle.zh}
              <span lang="en">{detailCopy.relatedWorksTitle.en}</span>
            </h2>
            <Link href="/collection">
              {detailCopy.breadcrumb.zh}{" "}
              <span lang="en">{detailCopy.breadcrumb.en}</span> →
            </Link>
          </div>
          <ArtworkGrid artworks={relatedWorks.slice(0, 4)} fillRows groupWideWorks swipeOnTablet />
        </section>
      ) : null}
    </article>
  );
}
