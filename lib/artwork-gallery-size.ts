export function artworkGallerySize(width: number, height: number) {
  const ratio = width / height;
  const fraction = ratio <= 0.85 ? 0.5 : Math.min(0.6, 0.5 + (ratio - 0.85) * 0.6);
  const sizes = ratio > 1.5 ? "100vw" : `(max-width: 860px) 100vw, ${Math.round(fraction * 100)}vw`;
  return { ratio, fraction, sizes };
}
