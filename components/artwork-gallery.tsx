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

  const activeImageSrc = withImageVersion(activeImage);

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden bg-[var(--surface-strong)]">
        <Image
          src={activeImageSrc}
          alt={title}
          width={1200}
          height={1500}
          priority
          unoptimized
          className="aspect-[4/5] h-full w-full object-cover"
        />
      </div>
      {detailImages.length ? (
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">细节图 · Details</p>
            {activeImage !== primaryImage ? (
              <button
                type="button"
                onClick={() => setActiveImage(primaryImage)}
                className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                返回主图
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
            {detailImages.map((image, index) => {
              const active = image === activeImage;

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={`relative overflow-hidden border transition-colors ${
                    active
                      ? "border-[var(--line-strong)]"
                      : "border-[var(--line)] hover:border-[var(--line-strong)]"
                  }`}
                >
                  <Image
                    src={withImageVersion(image)}
                    alt={`${title} 细节图 ${index + 1}`}
                    width={320}
                    height={400}
                    unoptimized
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
