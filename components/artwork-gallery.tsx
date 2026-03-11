"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { withImageVersion } from "@/lib/image-url";

import { MediaPlaceholder } from "./media-placeholder";

type ArtworkGalleryProps = {
  title: string;
  primaryImage: string;
  category?: string;
  gallery?: string[];
};

export function ArtworkGallery({
  title,
  primaryImage,
  category = "",
  gallery = [],
}: ArtworkGalleryProps) {
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const detailImages = useMemo(() => {
    const seen = new Set<string>();

    return gallery.filter((image) => {
      const normalized = image.trim();

      if (!normalized || normalized === primaryImage || normalized.startsWith("/api/placeholder/") || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
  }, [gallery, primaryImage]);
  const thumbnailImages = useMemo(() => [primaryImage, ...detailImages], [detailImages, primaryImage]);
  const [activeImage, setActiveImage] = useState(primaryImage);

  useEffect(() => {
    setActiveImage(primaryImage);
  }, [primaryImage]);

  useEffect(() => {
    if (activeImage === primaryImage || detailImages.includes(activeImage)) {
      return;
    }

    setActiveImage(primaryImage);
  }, [activeImage, detailImages, primaryImage]);

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
        setActiveImage(thumbnailImages[(currentIndex + 1) % thumbnailImages.length]);
      }

      if (event.key === "ArrowLeft") {
        setActiveImage(
          thumbnailImages[(currentIndex - 1 + thumbnailImages.length) % thumbnailImages.length],
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
  const isActivePlaceholder = !activeImage || activeImage.startsWith("/api/placeholder/");
  const categoryHint = category.toLowerCase();
  const isPaintingLike =
    categoryHint.includes("唐卡") ||
    categoryHint.includes("绘画") ||
    categoryHint.includes("thangka") ||
    categoryHint.includes("painting");
  const isVeryTall = naturalRatio !== null && naturalRatio < 0.78;
  const desktopContainerClass = isPaintingLike || isVeryTall
    ? "lg:min-h-[48rem] lg:items-start lg:px-1 lg:py-1"
    : "lg:min-h-[41rem] lg:items-start lg:px-1 lg:py-1";
  const desktopFrameClass = isPaintingLike || isVeryTall
    ? "lg:flex lg:w-full lg:justify-center"
    : "lg:flex lg:w-full lg:justify-center";
  const desktopImageClass = isPaintingLike || isVeryTall
    ? "lg:h-auto lg:w-auto lg:min-w-[34rem] lg:max-h-[84vh] lg:max-w-[46rem] lg:object-contain lg:object-top xl:min-w-[38rem] xl:max-w-[50rem]"
    : "lg:h-auto lg:w-full lg:max-h-[78vh] lg:max-w-[54rem] lg:object-contain lg:object-top";

  const canOpenLightbox = !isActivePlaceholder;

  const stepLightboxImage = (direction: "prev" | "next") => {
    if (thumbnailImages.length < 2) {
      return;
    }

    const nextIndex =
      direction === "next"
        ? (activeImageIndex + 1) % thumbnailImages.length
        : (activeImageIndex - 1 + thumbnailImages.length) % thumbnailImages.length;
    setActiveImage(thumbnailImages[nextIndex]);
  };

  return (
    <>
      <div
        className={`grid gap-5 lg:items-start lg:gap-6 ${
          hasMultipleImages ? "lg:grid-cols-[72px_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)]"
        }`}
      >
        {hasMultipleImages ? (
          <div className="order-2 flex gap-2.5 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
          {thumbnailImages.map((image, index) => {
            const active = image === activeImage;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`${title} image ${index + 1}`}
                onClick={() => setActiveImage(image)}
                className="group shrink-0 cursor-pointer select-none"
              >
                <div
                  className={`relative overflow-hidden border bg-[var(--surface-strong)] transition-colors ${
                    active
                      ? "border-[var(--line-strong)]/72 ring-1 ring-[var(--line-strong)]/12"
                      : "border-[var(--line)]/42 group-hover:border-[var(--line-strong)]/42"
                  }`}
                >
                  {image.startsWith("/api/placeholder/") ? (
                    <div className="flex aspect-[4/5] h-[90px] w-[68px] items-end bg-[linear-gradient(180deg,rgba(239,235,229,0.8)_0%,rgba(233,228,221,0.97)_100%)] p-2.5 lg:h-[98px] lg:w-[72px]">
                      <div className="w-full border-t border-[var(--line)]/44 pt-1.5 text-left">
                        <span className="block text-[0.34rem] uppercase tracking-[0.16em] text-[var(--accent)]/34">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={withImageVersion(image)}
                      alt={title}
                      width={220}
                      height={275}
                      unoptimized
                      className="aspect-[4/5] h-[90px] w-[68px] object-cover lg:h-[98px] lg:w-[72px]"
                    />
                  )}
                </div>
              </button>
            );
          })}
          </div>
        ) : null}
        <div className={`order-1 min-w-0 grid gap-3.5 ${hasMultipleImages ? "" : "lg:justify-items-center"}`}>
          <div className={`relative overflow-hidden bg-[var(--surface-strong)] lg:flex lg:overflow-visible ${desktopContainerClass}`}>
            {isActivePlaceholder ? (
              <div className="aspect-[4/5] lg:flex lg:min-h-full lg:w-full lg:items-start lg:justify-center">
                <MediaPlaceholder eyebrow="Artwork Image" title={title} />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className={`block w-full cursor-zoom-in ${desktopFrameClass}`}
                data-protect-wrap="true"
              >
                <Image
                  src={activeImageSrc}
                  alt={title}
                  width={1200}
                  height={1500}
                  priority
                  unoptimized
                  draggable={false}
                  data-protect="true"
                  onContextMenu={(event) => event.preventDefault()}
                  onDragStart={(event) => event.preventDefault()}
                  onLoad={(event) => {
                    const target = event.currentTarget;
                    if (target.naturalWidth > 0 && target.naturalHeight > 0) {
                      setNaturalRatio(target.naturalWidth / target.naturalHeight);
                    }
                  }}
                  className={`aspect-[4/5] h-full w-full object-cover ${desktopImageClass}`}
                />
              </button>
            )}
          </div>
          {thumbnailImages.length > 1 && activeImage !== primaryImage && !primaryImage.startsWith("/api/placeholder/") ? (
            <div className="flex justify-end border-t border-[var(--line)]/34 pt-3 text-[var(--muted)]">
              <button
                type="button"
                onClick={() => setActiveImage(primaryImage)}
                className="cursor-pointer select-none text-[0.74rem] tracking-[0.06em] transition-colors hover:text-[var(--ink)]"
              >
                返回主图
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isLightboxOpen && canOpenLightbox ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(12,10,8,0.9)] px-4 py-6 backdrop-blur-[1px] md:px-8 md:py-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative flex h-full w-full max-w-[1380px] flex-col justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between text-[var(--surface)]/88">
              <div className="min-h-6 text-[0.8rem] tracking-[0.08em]">
                {thumbnailImages.length > 1 ? `${activeImageIndex + 1} / ${thumbnailImages.length}` : null}
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="cursor-pointer select-none text-[0.8rem] tracking-[0.08em] transition-colors hover:text-[var(--surface)]"
              >
                关闭
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden border border-[rgba(244,239,232,0.12)] bg-[rgba(247,243,237,0.03)] px-4 py-4 md:px-6 md:py-6">
              {thumbnailImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => stepLightboxImage("prev")}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer select-none border border-[rgba(244,239,232,0.18)] px-3 py-2 text-[0.72rem] text-[var(--surface)]/82 transition-colors hover:text-[var(--surface)]"
                  >
                    上一张
                  </button>
                  <button
                    type="button"
                    onClick={() => stepLightboxImage("next")}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer select-none border border-[rgba(244,239,232,0.18)] px-3 py-2 text-[0.72rem] text-[var(--surface)]/82 transition-colors hover:text-[var(--surface)]"
                  >
                    下一张
                  </button>
                </>
              ) : null}
              <Image
                src={activeImageSrc}
                alt={title}
                width={1600}
                height={2000}
                unoptimized
                draggable={false}
                data-protect="true"
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
                className="max-h-full max-w-full object-contain object-center"
              />
            </div>
            {thumbnailImages.length > 1 ? (
              <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
                {thumbnailImages.map((image, index) => {
                  const active = image === activeImage;
                  return (
                    <button
                      key={`lightbox-${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      className={`h-1.5 w-8 shrink-0 cursor-pointer rounded-full transition-colors ${
                        active ? "bg-[var(--surface)]/82" : "bg-[var(--surface)]/24"
                      }`}
                      aria-label={`切换到第 ${index + 1} 张图片`}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
