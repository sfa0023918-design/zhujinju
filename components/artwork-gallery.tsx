"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import measuredSizes from "@/lib/data/artwork-image-sizes.json";
import { packArtworkRows } from "@/lib/artwork-rows";
import { withImageVersion } from "@/lib/image-url";
import {
  COVER_VAJRA_BACKDROP,
  COVER_VAJRA_CLIP,
  COVER_VAJRA_DETAIL_MASKS,
  COVER_VAJRA_IMAGE,
} from "@/lib/artwork-presentation";

import type { ImageAsset } from "@/lib/data/types";
import { HistoryBackLink } from "./history-back-link";
import styles from "./artwork-detail.module.css";
import { MediaPlaceholder } from "./media-placeholder";
import { ProtectedImage } from "./protected-image";

type ArtworkGalleryProps = {
  title: string;
  primaryImage: string;
  primaryImageCandidates?: string[];
  width: number;
  height: number;
  galleryAssets?: Array<ImageAsset | null>;
  children: ReactNode;
  backLabel: { zh: string; en: string };
  gallery?: string[];
};

function isVajraImage(image: string) {
  return (
    image === COVER_VAJRA_IMAGE || Boolean(COVER_VAJRA_DETAIL_MASKS[image])
  );
}

function vajraImageStyle(image: string): CSSProperties | undefined {
  if (image === COVER_VAJRA_IMAGE) {
    return { clipPath: COVER_VAJRA_CLIP };
  }

  const mask = COVER_VAJRA_DETAIL_MASKS[image];
  if (!mask) {
    return undefined;
  }

  const maskUrl = `url("${mask}")`;
  return {
    maskImage: maskUrl,
    maskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskImage: maskUrl,
    WebkitMaskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
  };
}

export function ArtworkGallery({
  title,
  primaryImage,
  primaryImageCandidates = [],
  width,
  height,
  galleryAssets = [],
  children,
  backLabel,
  gallery = [],
}: ArtworkGalleryProps) {
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const normalizedPrimaryCandidates = useMemo(() => {
    const seen = new Set<string>();
    const candidates = [primaryImage, ...primaryImageCandidates]
      .map((value) => value.trim())
      .filter((value) => {
        if (!value || seen.has(value)) {
          return false;
        }

        seen.add(value);
        return true;
      });

    return candidates;
  }, [primaryImage, primaryImageCandidates]);
  const [primaryCandidateIndex, setPrimaryCandidateIndex] = useState(0);
  const resolvedPrimaryImage =
    normalizedPrimaryCandidates[primaryCandidateIndex] ?? "";
  const detailImages = useMemo(() => {
    const seen = new Set<string>();

    return gallery.filter((image) => {
      const normalized = image.trim();

      if (
        !normalized ||
        normalized === resolvedPrimaryImage ||
        normalized.startsWith("/api/placeholder/") ||
        seen.has(normalized)
      ) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
  }, [gallery, resolvedPrimaryImage]);
  const thumbnailImages = useMemo(
    () =>
      [resolvedPrimaryImage, ...detailImages].filter((image) =>
        Boolean(image.trim()),
      ),
    [detailImages, resolvedPrimaryImage],
  );
  const [activeImage, setActiveImage] = useState(resolvedPrimaryImage);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setPrimaryCandidateIndex(0);
  }, [normalizedPrimaryCandidates]);

  useEffect(() => {
    setActiveImage(resolvedPrimaryImage);
  }, [resolvedPrimaryImage]);

  useEffect(() => {
    if (
      activeImage === resolvedPrimaryImage ||
      detailImages.includes(activeImage)
    ) {
      return;
    }

    setActiveImage(resolvedPrimaryImage);
  }, [activeImage, detailImages, resolvedPrimaryImage]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        return;
      }

      if (thumbnailImages.length < 2) {
        return;
      }

      const currentIndex = thumbnailImages.indexOf(activeImage);
      if (currentIndex < 0) {
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveImage(
          thumbnailImages[(currentIndex + 1) % thumbnailImages.length],
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveImage(
          thumbnailImages[
            (currentIndex - 1 + thumbnailImages.length) % thumbnailImages.length
          ],
        );
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, isLightboxOpen, thumbnailImages]);

  const hasMultipleImages = thumbnailImages.length > 1;
  const activeImageIndex = Math.max(thumbnailImages.indexOf(activeImage), 0);
  const activeImageSrc = withImageVersion(activeImage);
  const isVajraActive = isVajraImage(activeImage);
  const isActivePlaceholder =
    !activeImage || activeImage.startsWith("/api/placeholder/");

  const canOpenLightbox = !isActivePlaceholder;

  const stepLightboxImage = (direction: "prev" | "next") => {
    if (thumbnailImages.length < 2) {
      return;
    }

    const nextIndex =
      direction === "next"
        ? (activeImageIndex + 1) % thumbnailImages.length
        : (activeImageIndex - 1 + thumbnailImages.length) %
          thumbnailImages.length;
    setActiveImage(thumbnailImages[nextIndex]);
  };

  const tryFallbackPrimaryImage = () => {
    if (activeImage !== resolvedPrimaryImage) {
      return;
    }

    setPrimaryCandidateIndex((current) => {
      const next = current + 1;
      return next < normalizedPrimaryCandidates.length ? next : current;
    });
  };

  const ratio = width / height;
  const fraction =
    ratio <= 0.85 ? 0.5 : Math.min(0.6, 0.5 + (ratio - 0.85) * 0.6);
  const imageSize = (src: string) => {
    const asset = galleryAssets.find(
      (a) => a && [a.original, a.detail, a.hero, a.card].includes(src),
    );
    const measured = (measuredSizes as Record<string, number[]>)[src];
    return {
      width: asset?.width ?? measured?.[0] ?? width,
      height: asset?.height ?? measured?.[1] ?? height,
    };
  };
  const navigation = (
    <div className={styles.galleryNavigation}>
      <HistoryBackLink fallbackHref="/collection" className={styles.backAction}>
        ← {backLabel.zh} <span lang="en">{backLabel.en}</span>
      </HistoryBackLink>
      {hasMultipleImages ? (
        <div className={styles.imageNavigation}>
          <span>
            图 {activeImageIndex + 1} / {thumbnailImages.length}
          </span>
          <div className={styles.imageDots}>
            {thumbnailImages.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`${title} image ${index + 1}`}
                aria-pressed={activeImage === src}
                onClick={() => setActiveImage(src)}
              >
                <span />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
  return (
    <>
      <section
        id="artwork-info"
        className={styles.hero}
        data-layout={ratio > 1.5 ? "panorama" : "split"}
        style={
          {
            "--image-fraction": fraction,
            "--image-ratio": naturalRatio ?? ratio,
          } as CSSProperties
        }
      >
        <div className={styles.panoramaNavigation}>{navigation}</div>
        <div
          className={styles.galleryColumn}
          style={
            isVajraActive ? { background: COVER_VAJRA_BACKDROP } : undefined
          }
        >
          {isActivePlaceholder ? (
            <MediaPlaceholder eyebrow="Artwork Image" title={title} />
          ) : (
            <button
              type="button"
              aria-label={`放大 ${title}`}
              className={styles.primaryImageButton}
              onClick={() => setIsLightboxOpen(true)}
            >
              <ProtectedImage
                src={activeImageSrc}
                alt={title}
                width={imageSize(activeImage).width}
                height={imageSize(activeImage).height}
                priority
                unoptimized
                wrapperClassName={styles.primaryImageFrame}
                className={styles.primaryImage}
                style={vajraImageStyle(activeImage)}
                onError={tryFallbackPrimaryImage}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  if (img.naturalWidth && img.naturalHeight)
                    setNaturalRatio(img.naturalWidth / img.naturalHeight);
                }}
              />
            </button>
          )}
          {activeImage !== resolvedPrimaryImage ? (
            <button
              type="button"
              className={styles.returnPrimary}
              onClick={() => setActiveImage(resolvedPrimaryImage)}
            >
              返回主图
            </button>
          ) : null}
        </div>
        <aside className={styles.recordColumn}>
          <div className={styles.recordNavigation}>{navigation}</div>
          {children}
        </aside>
      </section>
      {detailImages.length ? (
        <section className={styles.detailsSection}>
          <div className={styles.detailsImages}>
            {packArtworkRows(
              detailImages.map(
                (src) => imageSize(src).width / imageSize(src).height,
              ),
              "details",
            ).map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={styles.detailsRow}
                style={{
                  gridTemplateColumns: [
                    ...row.ratios,
                    ...(row.spacer ? [row.spacer] : []),
                  ]
                    .map((r) => `minmax(0, ${r * 1000}fr)`)
                    .join(" "),
                }}
              >
                {row.indexes.map((index) => {
                  const src = detailImages[index];
                  return (
                    <button
                      key={src}
                      type="button"
                      aria-label={`放大局部图 ${index + 2}`}
                      onClick={() => {
                        setActiveImage(src);
                        setIsLightboxOpen(true);
                      }}
                      style={{
                        background: isVajraImage(src)
                          ? COVER_VAJRA_BACKDROP
                          : undefined,
                      }}
                    >
                      <ProtectedImage
                        src={withImageVersion(src)}
                        alt={`${title} · 局部 ${index + 1}`}
                        width={imageSize(src).width}
                        height={imageSize(src).height}
                        unoptimized
                        wrapperClassName={styles.detailImageFrame}
                        className={styles.detailImage}
                        style={vajraImageStyle(src)}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className={styles.detailsCaption}>
            <span>图 2 – {thumbnailImages.length} · 局部 · Details</span>
            <span>点击图片放大 · Click to enlarge</span>
          </p>
        </section>
      ) : null}

      {isMounted && isLightboxOpen && canOpenLightbox
        ? createPortal(
            <div
              className={styles.lightbox}
              role="dialog"
              aria-modal="true"
              onClick={() => setIsLightboxOpen(false)}
            >
              <div className={styles.lightboxBackdrop} />
              <div
                className="relative z-10 mx-auto flex h-full w-full max-w-[1380px] flex-col"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.lightboxToolbar}>
                  <div className="min-h-6 text-[0.8rem] tracking-[0.08em]">
                    {thumbnailImages.length > 1
                      ? `${activeImageIndex + 1} / ${thumbnailImages.length}`
                      : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(false)}
                    className={styles.lightboxClose}
                  >
                    关闭
                  </button>
                </div>
                <div
                  className="relative z-20 min-h-[calc(100vh-7.5rem)] flex-1 overflow-hidden border border-[rgba(244,239,232,0.12)] bg-[rgba(247,243,237,0.03)] md:min-h-[calc(100vh-9rem)]"
                  style={
                    isVajraActive
                      ? { backgroundColor: COVER_VAJRA_BACKDROP }
                      : undefined
                  }
                >
                  {thumbnailImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => stepLightboxImage("prev")}
                        className={`${styles.lightboxStep} ${styles.previous}`}
                      >
                        上一张
                      </button>
                      <button
                        type="button"
                        onClick={() => stepLightboxImage("next")}
                        className={`${styles.lightboxStep} ${styles.next}`}
                      >
                        下一张
                      </button>
                    </>
                  ) : null}
                  <div className="relative z-20 flex h-full min-h-full overflow-auto px-3 py-3 md:px-6 md:py-6">
                    <div className="flex min-h-[calc(100vh-9rem)] w-full items-center justify-center md:min-h-[calc(100vh-11rem)]">
                      <ProtectedImage
                        src={activeImageSrc}
                        alt={title}
                        width={1600}
                        height={2000}
                        unoptimized
                        wrapperClassName="inline-block !h-auto !w-auto"
                        className="relative z-30 h-auto w-auto max-h-[calc(100vh-9rem)] max-w-[min(100%,72rem)] object-contain object-center md:max-h-[calc(100vh-11rem)]"
                        style={vajraImageStyle(activeImage)}
                      />
                    </div>
                  </div>
                </div>
                {thumbnailImages.length > 1 ? (
                  <div className="relative z-20 mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
                    {thumbnailImages.map((image, index) => {
                      const active = image === activeImage;
                      return (
                        <button
                          key={`lightbox-${image}-${index}`}
                          type="button"
                          onClick={() => setActiveImage(image)}
                          className={`h-1.5 w-8 shrink-0 cursor-pointer rounded-full transition-colors ${
                            active
                              ? "bg-[var(--surface)]/82"
                              : "bg-[var(--surface)]/24"
                          }`}
                          aria-label={`切换到第 ${index + 1} 张图片`}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
