"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { artworkGallerySize } from "@/lib/artwork-gallery-size";
import { warmImage } from "@/lib/warm-image";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  source: string;
  width: number;
  height: number;
  warmWhenVisible: boolean;
};

export function ArtworkGridLink({ source, width, height, href, warmWhenVisible, ...link }: Props) {
  const router = useRouter();
  return (
    <Link
      {...link}
      href={href}
      prefetch={warmWhenVisible ? null : false}
      onPointerEnter={(event) => {
        if (!warmWhenVisible && event.pointerType === "mouse") router.prefetch(href);
      }}
      onFocus={(event) => {
        if (!warmWhenVisible && event.currentTarget.matches(":focus-visible")) router.prefetch(href);
      }}
      onNavigate={() => {
        warmImage(source, width, height, artworkGallerySize(width, height).sizes, 85);
      }}
    />
  );
}
