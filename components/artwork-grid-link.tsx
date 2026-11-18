"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { preload } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

import { artworkDisplayPhoto } from "@/lib/artwork-display-photo";
import { artworkGallerySize } from "@/lib/artwork-gallery-size";
import type { BilingualText } from "@/lib/site-data";
import { useNavigationPreview } from "./navigation-preview";
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
  title: BilingualText;
  facts: BilingualText;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
};

export function ArtworkGridLink({ href, source, width, height, title, facts, children, ...props }: Props) {
  const router = useRouter();
  const openPreview = useNavigationPreview();
  return (
    <Link {...props} href={href} prefetch={false}
      onPointerEnter={event => { if (event.pointerType === "mouse") router.prefetch(href); }}
      onFocus={event => { if (event.currentTarget.matches(":focus-visible")) router.prefetch(href); }}
      onNavigate={event => {
        if (!openPreview || !source || source.startsWith("/api/placeholder/")) return;
        event.preventDefault();
        openPreview(href, { title, facts, source, width, height, sizes: artworkGallerySize(width, height).sizes, thumbnail: artworkCardPreview(source) });
      }}
      onClick={event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !source || source.startsWith("/api/placeholder/")) return;
        const card = event.currentTarget.querySelector("img");
        lastCard = undefined;
        if (card?.complete && card.naturalWidth && card.currentSrc) {
          lastCard = { source, preview: card.currentSrc };
        }
        const sizes = artworkGallerySize(width, height).sizes;
        const photo = artworkDisplayPhoto(source);
        if (photo) {
          preload(photo.href, { as: "image", type: photo.type, imageSrcSet: photo.srcSet, imageSizes: sizes, fetchPriority: "high" });
          return;
        }
        const { props: image } = getImageProps({
          src: withImageVersion(source), width, height, alt: "", quality: 85,
          sizes,
        });
        preload(image.src, { as: "image", imageSrcSet: image.srcSet, imageSizes: image.sizes, fetchPriority: "high" });
      }}
    >
      {children}
    </Link>
  );
}
