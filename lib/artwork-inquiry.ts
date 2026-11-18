import type { Artwork, BilingualText } from "./data/types";
import { formatDimensions } from "./display-format";
import { resolveArtworkPrimaryImage } from "./image-url";

export function artworkInquiryHref(slug: string, request?: BilingualText) {
  const params = new URLSearchParams({ work: slug });
  if (request) params.set("request", request.zh || request.en);
  return `/contact?${params}#inquiry`;
}

export function getInquiryWork(artwork: Artwork) {
  return {
    slug: artwork.slug,
    title: artwork.title,
    details: {
      zh: [artwork.period.zh, formatDimensions(artwork.dimensions.zh)].filter(Boolean).join(" · "),
      en: [artwork.period.en, formatDimensions(artwork.dimensions.en)].filter(Boolean).join(" · "),
    },
    image: resolveArtworkPrimaryImage(artwork),
  };
}

export type InquiryWork = ReturnType<typeof getInquiryWork>;

export function getInquiryRequest(artwork: Artwork, value?: string) {
  return value ? artwork.inquirySupport.find((item) => item.zh === value || item.en === value) : undefined;
}
