import Link from "next/link";
import type { CSSProperties } from "react";
import { HomeHighlights } from "@/components/home-highlights";
import { ProtectedImage } from "@/components/protected-image";
import {
  COVER_VAJRA_CLIP,
  COVER_VAJRA_IMAGE,
  COVER_VAJRA_SLUG,
} from "@/lib/artwork-presentation";
import { packArtworkRows } from "@/lib/artwork-rows";
import { getArtworkStatusText } from "@/lib/bilingual";
import { resolveArtworkPrimaryImage, withImageVersion } from "@/lib/image-url";
import type { Artwork } from "@/lib/site-data";
import styles from "@/app/(site)/home.module.css";

function ratio(artwork: Artwork) {
  if (artwork.slug === COVER_VAJRA_SLUG) return 900 / 1198;
  return artwork.imageAsset?.width && artwork.imageAsset?.height
    ? artwork.imageAsset.width / artwork.imageAsset.height
    : 0.8;
}

function Card({ artwork }: { artwork: Artwork }) {
  const vajra = artwork.slug === COVER_VAJRA_SLUG;
  const status = getArtworkStatusText(artwork.status);
  const width = vajra ? 900 : (artwork.imageAsset?.width ?? 800);
  const height = vajra ? 1198 : (artwork.imageAsset?.height ?? 1000);
  const titleParts = artwork.title.zh.match(/^(.*?)([（(].+[）)])$/);
  const regionPeriod = [artwork.region.zh, artwork.period.zh]
    .filter(Boolean)
    .join("，");
  return (
    <Link
      href={`/collection/${artwork.slug}`}
      className={styles.artworkCard}
      style={{ "--artwork-ratio": width / height } as CSSProperties}
    >
      <ProtectedImage
        src={withImageVersion(
          vajra ? COVER_VAJRA_IMAGE : resolveArtworkPrimaryImage(artwork),
        )}
        alt={`${artwork.title.zh} ${artwork.title.en}`}
        width={width}
        height={height}
        sizes={`(max-width: 860px) ${Math.ceil((260 * width) / height)}px, (max-width: 1279px) 25vw, 400px`}
        quality={84}
        wrapperClassName={`${styles.cardImageFrame} ${vajra ? styles.vajraCard : ""}`}
        className={styles.cardImage}
        style={vajra ? { clipPath: COVER_VAJRA_CLIP } : undefined}
      />
      <span className={styles.cardTitle}>
        {titleParts ? (
          <>
            {titleParts[1]}
            <span className={styles.cardTitleNote}>{titleParts[2]}</span>
          </>
        ) : (
          artwork.title.zh
        )}
      </span>
      <span className={styles.cardEnglish} lang="en">
        {artwork.title.en}
      </span>
      <span className={styles.cardFacts}>{regionPeriod}</span>
      <span className={styles.cardStatus} data-artwork-status={artwork.status}>
        <i className={styles.statusDot} data-status={artwork.status} />
        <span>{status.zh}</span>
        <span className={styles.cardStatusEnglish} lang="en">
          {artwork.status === "sold"
            ? "Acquired"
            : artwork.status === "reserved"
              ? "On Hold"
              : "Available"}
        </span>
      </span>
    </Link>
  );
}

// The homepage reference keeps all four highlights in one row at tablet widths.
// Its rendered layout takes precedence over the generic tablet packing table.
export function HomeArtworkGrid({ artworks }: { artworks: Artwork[] }) {
  return (
    <>
      <div className={`${styles.artworkRows} ${styles.desktopRows}`}>
        {packArtworkRows(artworks.map(ratio), "desktop").map((row, index) => (
          <div
            key={index}
            className={styles.artworkRow}
            style={{
              gridTemplateColumns: [
                ...row.ratios,
                ...(row.spacer ? [row.spacer] : []),
              ]
                .map((value) => `minmax(0, ${value * 1000}fr)`)
                .join(" "),
            }}
          >
            {row.indexes.map((i) => (
              <Card key={artworks[i].slug} artwork={artworks[i]} />
            ))}
          </div>
        ))}
      </div>
      <div className={`${styles.artworkRows} ${styles.mobileRows}`}>
        <HomeHighlights count={artworks.length} className={styles.mobileRail}>
          {artworks.map((artwork) => (
            <Card key={artwork.slug} artwork={artwork} />
          ))}
        </HomeHighlights>
      </div>
    </>
  );
}
