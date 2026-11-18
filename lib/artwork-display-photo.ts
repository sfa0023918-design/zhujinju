import display from "./data/artwork-display.json";
import exhibitionCover from "./data/exhibition-cover-photo.json";
import { COVER_VAJRA_IMAGE } from "./artwork-presentation";

type Photo = { key: string; width: number };
const photos: Record<string, Photo> = display.photos;

export function artworkDisplayPhoto(source: string) {
  if (source === COVER_VAJRA_IMAGE) return exhibitionCover;
  const photo = photos[source];
  if (!photo) return undefined;
  const widths = [...new Set(display.widths.map(width => Math.min(width, photo.width)))];
  const url = (width: number) => `/uploads/display/${photo.key}-${width}.avif`;
  return {
    type: "image/avif",
    href: url(widths[0]),
    srcSet: widths.map(width => `${url(width)} ${width}w`).join(", "),
  };
}
