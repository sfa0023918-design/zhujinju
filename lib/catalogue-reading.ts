import type { CataloguePageGeometry } from "./catalogue-media";

export type CataloguePosition = { index: number; half: 0 | 1 };

export function moveCataloguePosition(
  position: CataloguePosition,
  direction: -1 | 1,
  geometries: readonly CataloguePageGeometry[],
  singlePage: boolean,
  pairSingleImages: boolean,
): CataloguePosition {
  const count = geometries.length;
  const hasRightCover = geometries[0]?.openingSide === "right";
  if (count < 1) return position;
  if (!singlePage) {
    const step = pairSingleImages ? 2 : 1;
    const candidate = position.index + direction * step;
    const index = candidate >= count ? position.index : Math.max(0, candidate);
    return { index, half: index === 0 && hasRightCover ? 1 : 0 };
  }
  if (direction === 1) {
    if (geometries[position.index]?.spread && position.half === 0) return { ...position, half: 1 };
    if (position.index < count - 1) return { index: position.index + 1, half: geometries[position.index + 1]?.openingSide === "right" ? 1 : 0 };
  } else {
    if (geometries[position.index]?.spread && position.half === 1 && !(position.index === 0 && hasRightCover)) return { ...position, half: 0 };
    if (position.index > 0) return { index: position.index - 1, half: geometries[position.index - 1]?.spread ? 1 : 0 };
  }
  return position;
}

export function clampCataloguePan(x: number, y: number, scale: number, width: number, height: number) {
  const limitX = width * (scale - 1) / 2;
  const limitY = height * (scale - 1) / 2;
  return {
    x: Math.min(limitX, Math.max(-limitX, x)),
    y: Math.min(limitY, Math.max(-limitY, y)),
  };
}
