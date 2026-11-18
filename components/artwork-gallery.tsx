"use client";

import { artworkGallerySize } from "@/lib/artwork-gallery-size";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { getImageProps } from "next/image";

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
import { ModalDialog } from "./modal-dialog";
import { useNativeCarousel } from "./use-native-carousel";
import { DirectionalArrow } from "./directional-arrow";

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

function LightboxTrack({ images, active, select, title, sizeOf, previews }: {
  images: string[];
  active: number;
  select: (index: number) => void;
  title: string;
  sizeOf: (src: string) => { width: number; height: number };
  previews: ReadonlyMap<string, string>;
}) {
  const carousel = useNativeCarousel({ count: images.length, active, onChange: select, loop: true });
  const [decoded, setDecoded] = useState<ReadonlySet<string>>(() => new Set());
  const [adjacent, setAdjacent] = useState<{ from: string; to: string } | null>(null);
  const previous = useRef(active);
  const direction = useRef(1);
  const current = images[active];
  useEffect(() => {
    const count = images.length;
    const distance = (active - previous.current + count) % count;
    if (distance) direction.current = distance > count / 2 ? -1 : 1;
    previous.current = active;
    if (count < 2 || !decoded.has(current)) return;
    const to = images[(active + direction.current + count) % count];
    if (!decoded.has(to)) setAdjacent({ from: current, to });
  }, [active, current, images, decoded]);

  return (
    <div className={styles.lightboxViewport} ref={carousel.ref}
      role="region" aria-label="作品图片 Artwork images" tabIndex={0}>
      {carousel.indexes.map((index, position) => {
        const src = images[index];
        const clone = images.length > 1 && (position === 0 || position === images.length + 1);
        const showOriginal = index === active || decoded.has(src) || (adjacent?.from === current && adjacent.to === src);
        const preview = previews.get(src);
        const dimensions = sizeOf(src);
        const media = {
          ...dimensions,
          unoptimized: true,
          wrapperClassName: styles.lightboxMedia,
          className: "relative z-30 h-auto w-auto max-h-full max-w-full object-contain object-center",
          style: vajraImageStyle(src),
        };
        return (
          <div className={styles.lightboxPanel} key={`${src}-${position}`} aria-hidden={clone || index !== active}>
            {preview && !decoded.has(src) ? <ProtectedImage {...media} src={preview} alt="" /> : null}
            {showOriginal ? <ProtectedImage
              {...media} src={withImageVersion(src)} alt={index ? `${title} · 局部 ${index}` : title}
              loading="eager" fetchPriority={index === active ? "high" : "low"}
              onLoad={() => setDecoded(last => last.has(src) ? last : new Set(last).add(src))}
            /> : null}
          </div>
        );
      })}
    </div>
  );
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
  const [native, setNative] = useState(false);
  const [primaryReady, setPrimaryReady] = useState(false);
  const previews = useRef(new Map<string, string>());
  const { ratio, fraction, sizes: gallerySizes } = artworkGallerySize(width, height);
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
    const media = window.matchMedia("(any-pointer: coarse), (max-width: 1180px)");
    const update = () => setNative(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setPrimaryCandidateIndex(0);
  }, [normalizedPrimaryCandidates]);

  useEffect(() => {
    setPrimaryReady(false);
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

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, isLightboxOpen, thumbnailImages]);

  const hasMultipleImages = thumbnailImages.length > 1;
  const activeImageIndex = Math.max(thumbnailImages.indexOf(activeImage), 0);
  const isVajraActive = isVajraImage(activeImage);
  const isActivePlaceholder =
    !activeImage || activeImage.startsWith("/api/placeholder/");

  const canOpenLightbox = !isActivePlaceholder;
  const primaryCarousel = useNativeCarousel({
    count: thumbnailImages.length, active: activeImageIndex,
    onChange: (index) => setActiveImage(thumbnailImages[index]),
    enabled: native, loop: native,
  });
  useEffect(() => {
    if (!primaryReady || !hasMultipleImages) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    // Cache only the adjacent views so a gesture does not wait for a new photo.
    for (const offset of [-1, 1]) {
      const image = new window.Image();
      image.decoding = "async";
      image.fetchPriority = "low";
      const src = thumbnailImages[(activeImageIndex + offset + thumbnailImages.length) % thumbnailImages.length];
      const { props } = getImageProps({
        src: withImageVersion(src), alt: "", width, height,
        sizes: gallerySizes, quality: 85,
      });
      image.sizes = props.sizes ?? "";
      image.srcset = props.srcSet ?? "";
      image.src = props.src;
      void image.decode?.().catch(() => {});
    }
  }, [activeImageIndex, primaryReady, hasMultipleImages, thumbnailImages, gallerySizes, width, height]);

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
            图 / Image {activeImageIndex + 1} / {thumbnailImages.length}
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
            "--gallery-frame-ratio": ratio,
          } as CSSProperties
        }
      >
        <div className={styles.panoramaNavigation}>{navigation}</div>
        <div
          className={styles.galleryColumn}
          data-native-carousel={native}
          style={
            isVajraActive ? { background: COVER_VAJRA_BACKDROP } : undefined
          }
        >
          {isActivePlaceholder ? (
            <MediaPlaceholder eyebrow="Artwork Image" title={title} />
          ) : (
            <div className={styles.galleryViewport} ref={primaryCarousel.ref}>
              {(native ? primaryCarousel.indexes : [activeImageIndex]).map((index, position) => {
                const src = thumbnailImages[index];
                const clone = native && hasMultipleImages && (position === 0 || position === thumbnailImages.length + 1);
                return (
                  <button
                    key={`${src}-${position}`}
                    type="button"
                    aria-label={`放大 ${title}${index ? ` · 局部 ${index}` : ""}`}
                    aria-hidden={clone || index !== activeImageIndex}
                    tabIndex={clone || index !== activeImageIndex ? -1 : 0}
                    className={styles.primaryImageButton}
                    onClick={() => { if (primaryCarousel.canClick()) setIsLightboxOpen(true); }}
                  >
                    <ProtectedImage
                      src={withImageVersion(src)}
                      alt={index ? `${title} · 局部 ${index}` : title}
                      width={imageSize(src).width}
                      height={imageSize(src).height}
                      priority={index === 0 && !clone}
                      loading={index === 0 && !clone ? undefined : "lazy"}
                      fetchPriority={index === 0 && !clone ? "high" : "low"}
                      sizes={gallerySizes}
                      quality={85}
                      wrapperClassName={styles.primaryImageFrame}
                      className={styles.primaryImage}
                      style={vajraImageStyle(src)}
                      onError={src === resolvedPrimaryImage ? tryFallbackPrimaryImage : undefined}
                      onLoad={(event) => {
                        const img = event.currentTarget;
                        previews.current.set(src, img.currentSrc);
                        if (src === resolvedPrimaryImage && img.naturalWidth && img.naturalHeight) {
                          setNaturalRatio(img.naturalWidth / img.naturalHeight);
                          setPrimaryReady(true);
                        }
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
          {hasMultipleImages ? <p className={styles.gallerySwipeHint}>左右滑动查看 · 点按放大 <span lang="en">Swipe · Tap to enlarge</span></p> : null}
          {activeImage !== resolvedPrimaryImage ? (
            <button
              type="button"
              className={styles.returnPrimary}
              data-no-swipe
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
                        sizes="(max-width: 860px) 100vw, 50vw"
                        quality={85}
                        onLoad={event => previews.current.set(src, event.currentTarget.currentSrc)}
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
            <span>图 / {thumbnailImages.length === 2 ? "Image 2" : `Images 2–${thumbnailImages.length}`} · 局部 · Details</span>
            <span>点击图片放大 · Click to enlarge</span>
          </p>
        </section>
      ) : null}

      {isMounted && isLightboxOpen && canOpenLightbox
        ? createPortal(
            <ModalDialog
              className={styles.lightbox}
              label={`${title} · 图片放大 Image viewer`}
              onDismiss={() => setIsLightboxOpen(false)}
            >
              <div
                className={styles.lightboxBackdrop}
                onClick={() => setIsLightboxOpen(false)}
              />
              <div
                className="relative z-10 mx-auto flex h-full w-full max-w-[1380px] flex-col"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.lightboxToolbar}>
                  <div className={styles.lightboxPagination}>
                    {hasMultipleImages ? (
                      <>
                        <button
                          type="button"
                          onClick={() => stepLightboxImage("prev")}
                          className={styles.lightboxStep}
                          aria-label="上一张 / Previous image"
                        >
                          <DirectionalArrow backwards />
                        </button>
                        <span className={styles.lightboxCount}>
                          {activeImageIndex + 1} / {thumbnailImages.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => stepLightboxImage("next")}
                          className={styles.lightboxStep}
                          aria-label="下一张 / Next image"
                        >
                          <DirectionalArrow />
                        </button>
                      </>
                    ) : null}
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
                  className="relative z-20 min-h-0 flex-1 overflow-hidden border border-[rgba(244,239,232,0.12)] bg-[rgba(247,243,237,0.03)]"
                  style={
                    isVajraActive
                      ? { backgroundColor: COVER_VAJRA_BACKDROP }
                      : undefined
                  }
                >
                  <LightboxTrack images={thumbnailImages} active={activeImageIndex}
                    select={index => setActiveImage(thumbnailImages[index])} title={title}
                    sizeOf={imageSize} previews={previews.current} />
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
                          className={styles.lightboxDot}
                          aria-pressed={active}
                          aria-label={`切换到第 ${index + 1} 张图片`}
                        >
                          <span />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </ModalDialog>,
            document.body,
          )
        : null}
    </>
  );
}
