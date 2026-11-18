"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { preload } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

import { artworkGallerySize } from "@/lib/artwork-gallery-size";
import { withImageVersion } from "@/lib/image-url";

let lastCard: { source: string; preview: string } | undefined;

export function artworkCardPreview(source: string) {
  return lastCard?.source === source ? lastCard.preview : undefined;
}

type Props = {
  href: string;
  source: string;
  width: number;
  height: number;
  warmRoute: boolean;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function ArtworkGridLink({ href, source, width, height, warmRoute, children, ...props }: Props) {
  const router = useRouter();
  return (
    <Link {...props} href={href} prefetch={warmRoute ? null : false}
      onPointerEnter={event => { if (event.pointerType === "mouse") router.prefetch(href); }}
      onFocus={event => { if (event.currentTarget.matches(":focus-visible")) router.prefetch(href); }}
      onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !source || source.startsWith("/api/placeholder/")) return;
        const card = event.currentTarget.querySelector("img");
        if (card?.complete && card.naturalWidth && card.currentSrc) {
          lastCard = { source, preview: card.currentSrc };
        }
        const { props: image } = getImageProps({
          src: withImageVersion(source), width, height, alt: "", quality: 85,
          sizes: artworkGallerySize(width, height).sizes,
        });
        preload(image.src, { as: "image", imageSrcSet: image.srcSet, imageSizes: image.sizes, fetchPriority: "high" });
      }}
    >
      {children}
    </Link>
  );
}
