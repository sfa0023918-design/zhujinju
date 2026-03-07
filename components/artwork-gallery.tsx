"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

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
  const images = useMemo(() => {
    const merged = [primaryImage, ...gallery].filter(Boolean);
    return Array.from(new Set(merged));
  }, [gallery, primaryImage]);
  const [activeImage, setActiveImage] = useState(images[0] ?? primaryImage);

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden bg-[var(--surface-strong)]">
        <Image
          src={activeImage}
          alt={title}
          width={1200}
          height={1500}
          priority
          unoptimized
          className="aspect-[4/5] h-full w-full object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 md:grid-cols-5">
          {images.map((image, index) => {
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
                  src={image}
                  alt={`${title} ${index + 1}`}
                  width={320}
                  height={400}
                  unoptimized
                  className="aspect-[4/5] h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
