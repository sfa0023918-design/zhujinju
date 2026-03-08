"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { withImageVersion } from "@/lib/image-url";

type ArtworkGalleryProps = {
  title: string;
  primaryImage: string;
  gallery?: string[];
};

export function ArtworkGallery({
  title,
  primaryImage,
  gallery = [],
}: ArtworkGalleryProps) {
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

  return (
    <div className="grid gap-5 lg:grid-cols-[72px_minmax(0,1fr)] lg:gap-6">
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
      <div className="order-1 grid gap-4">
        <div className="relative overflow-hidden bg-[var(--surface-strong)]">
          {isActivePlaceholder ? (
            <div className="relative flex aspect-[4/5] h-full w-full items-end bg-[linear-gradient(180deg,rgba(239,235,229,0.82)_0%,rgba(233,228,221,0.98)_100%)] p-6 md:p-8">
              <div className="absolute inset-6 border border-[var(--line)]/28 md:inset-8" />
              <div className="relative w-full border-t border-[var(--line)]/42 pt-3 text-[var(--muted)]">
                <p className="text-[0.72rem] tracking-[0.08em] text-[var(--muted)]/88">图像整理中</p>
                <p className="mt-0.5 text-[0.42rem] uppercase tracking-[0.18em] text-[var(--accent)]/34">
                  Image forthcoming
                </p>
              </div>
            </div>
          ) : (
            <Image
              src={activeImageSrc}
              alt={title}
              width={1200}
              height={1500}
              priority
              unoptimized
              className="aspect-[4/5] h-full w-full object-cover"
            />
          )}
        </div>
        {thumbnailImages.length > 1 && activeImage !== primaryImage && !primaryImage.startsWith("/api/placeholder/") ? (
          <div className="flex justify-end border-t border-[var(--line)]/42 pt-3.5 text-[var(--muted)]">
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
