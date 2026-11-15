import Link from "next/link";
import { packArtworkRows } from "@/lib/artwork-rows";
import {
  COVER_VAJRA_CLIP,
  COVER_VAJRA_IMAGE,
  COVER_VAJRA_SLUG,
  PAPER_BLEND_ARTWORK_SLUGS,
} from "@/lib/artwork-presentation";
import type { CollectionArtworkSummary } from "@/lib/collection-filtering";
import { resolveArtworkPrimaryImage, withImageVersion } from "@/lib/image-url";
import { getArtworkStatusText } from "@/lib/bilingual";
import { ProtectedImage } from "./protected-image";
import styles from "./artwork-grid.module.css";

export function ArtworkGrid({
  artworks,
  priority = false,
  fillRows = false,
}: {
  artworks: CollectionArtworkSummary[];
  priority?: boolean;
  fillRows?: boolean;
}) {
  const ratios = artworks.map((a) =>
    a.slug === COVER_VAJRA_SLUG
      ? 900 / 1198
      : (a.imageAsset?.width ?? 800) / (a.imageAsset?.height ?? 1000),
  );
  return (
    <div className={styles.grid}>
      {(["desktop", "tablet", "mobile"] as const).map((mode) => (
        <div key={mode} className={`${styles.rows} ${styles[mode]}`}>
          {packArtworkRows(ratios, mode, { fillRows }).map((row, index) => (
            <div
              key={index}
              className={styles.row}
              style={{
                gridTemplateColumns: [
                  ...row.ratios,
                  ...(row.spacer ? [row.spacer] : []),
                ]
                  .map((r) => `minmax(0, ${r * 1000}fr)`)
                  .join(" "),
              }}
            >
              {row.indexes.map((i) => {
                const a = artworks[i];
                const vajra = a.slug === COVER_VAJRA_SLUG;
                const status = getArtworkStatusText(a.status);
                return (
                  <Link
                    key={a.slug}
                    href={`/collection/${a.slug}`}
                    className={styles.card}
                  >
                    <ProtectedImage
                      src={withImageVersion(
                        vajra
                          ? COVER_VAJRA_IMAGE
                          : resolveArtworkPrimaryImage(a),
                      )}
                      alt={`${a.title.zh} ${a.title.en}`}
                      width={vajra ? 900 : (a.imageAsset?.width ?? 800)}
                      height={vajra ? 1198 : (a.imageAsset?.height ?? 1000)}
                      quality={84}
                      priority={priority && i < 3}
                      sizes="(max-width: 860px) 70vw, (max-width: 1279px) 50vw, 40vw"
                      wrapperClassName={`${styles.imageFrame} ${vajra ? styles.vajra : ""}`}
                      className={`${styles.image} ${PAPER_BLEND_ARTWORK_SLUGS.some((slug) => slug === a.slug) ? styles.paperBlend : ""}`}
                      style={vajra ? { clipPath: COVER_VAJRA_CLIP } : undefined}
                    />
                    <span className={styles.title}>{a.title.zh}</span>
                    <span className={styles.english} lang="en">
                      {a.title.en}
                    </span>
                    <span className={styles.facts}>
                      {[a.region.zh, a.period.zh].filter(Boolean).join("，")}
                      <span className={styles.extra}>
                        {[a.material.zh, a.dimensions.zh]
                          .filter(Boolean)
                          .map((text) => ` · ${text}`)}
                      </span>
                    </span>
                    <span className={styles.status} data-artwork-status={a.status}>
                      <i data-status={a.status} />
                      {status.zh}
                      <span lang="en">
                        {a.status === "sold"
                          ? "Acquired"
                          : a.status === "reserved"
                            ? "On Hold"
                            : "Available"}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
