const IMAGE_URL_VERSION = "r2";

import type { ImageAsset } from "./site-data";

type ArtworkImageSource = {
  image?: string;
  imageAsset?: ImageAsset | null;
};

function normalizeImageUrl(value: string | undefined | null) {
  return (value ?? "").trim();
}

export function resolveImageCandidates(values: Array<string | undefined | null>) {
  const seen = new Set<string>();
  const resolved: string[] = [];

  for (const value of values) {
    const normalized = normalizeImageUrl(value);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    resolved.push(normalized);
  }

  return resolved;
}

export function resolveArtworkPrimaryImageCandidates(source: ArtworkImageSource) {
  const asset = source.imageAsset;

  return resolveImageCandidates([
    source.image,
    asset?.original,
    asset?.hero,
    asset?.detail,
    asset?.card,
  ]);
}

export function resolveArtworkPrimaryImage(source: ArtworkImageSource) {
  return resolveArtworkPrimaryImageCandidates(source)[0] ?? "";
}

export function withImageVersion(src: string) {
  if (!src) {
    return src;
  }

  const versionSeed = src.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "image";
  const separator = src.includes("?") ? "&" : "?";

  return `${src}${separator}v=${encodeURIComponent(`${IMAGE_URL_VERSION}-${versionSeed}`)}`;
}
