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

  const thumbnailImages = [primaryImage, ...detailImages];
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
    ? "lg:min-h-[46rem] lg:items-start lg:p-2"
    : "lg:min-h-[40rem] lg:items-start lg:p-2";
  const desktopFrameClass = isPaintingLike || isVeryTall
    ? "lg:flex lg:w-full lg:min-w-[30rem] lg:justify-center xl:min-w-[34rem]"
    : "lg:flex lg:w-full lg:justify-center";
  const desktopImageClass = isPaintingLike || isVeryTall
    ? "lg:h-auto lg:w-auto lg:min-w-[30rem] lg:max-h-[82vh] lg:max-w-full lg:object-contain lg:object-top xl:min-w-[34rem]"
    : "lg:h-auto lg:w-full lg:max-h-[78vh] lg:max-w-full lg:object-contain lg:object-top";

  return (
    <div className="grid gap-5 lg:grid-cols-[72px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {thumbnailImages.length > 1 ? (
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
      <div className="order-1 min-w-0 grid gap-3.5">
        <div className={`relative overflow-hidden bg-[var(--surface-strong)] lg:flex lg:overflow-visible ${desktopContainerClass}`}>
          {isActivePlaceholder ? (
            <div className="aspect-[4/5] lg:flex lg:min-h-full lg:w-full lg:items-start lg:justify-center">
              <MediaPlaceholder eyebrow="Artwork Image" title={title} />
            </div>
          ) : (
            <div className={desktopFrameClass}>
              <Image
                src={activeImageSrc}
                alt={title}
                width={1200}
                height={1500}
                priority
                unoptimized
                onLoad={(event) => {
                  const target = event.currentTarget;
                  if (target.naturalWidth > 0 && target.naturalHeight > 0) {
                    setNaturalRatio(target.naturalWidth / target.naturalHeight);
                  }
                }}
                className={`aspect-[4/5] h-full w-full object-cover ${desktopImageClass}`}
              />
            </div>
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
  );
}
