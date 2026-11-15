import { packArtworkRows, type ArtworkRow } from "./artwork-rows";

type GridMode = "desktop" | "tablet" | "mobile";

function rowSlot(row: ArtworkRow, index: number, mode: GridMode) {
  const total = row.ratios.reduce((sum, ratio) => sum + ratio, row.spacer);
  const fraction = row.ratios[row.indexes.indexOf(index)] / total;
  const columns = row.ratios.length + (row.spacer ? 1 : 0);
  const gutter = mode === "mobile" ? 40 : 80;
  const gap = mode === "mobile" ? 6 : 8;
  const inset = gutter + (columns - 1) * gap;
  return {
    fluid: `calc(${(fraction * 100).toFixed(4)}vw - ${(inset * fraction).toFixed(4)}px)`,
    capped: `${Math.ceil((1600 - inset) * fraction)}px`,
  };
}

/** Match the approved packed rows without changing their visible dimensions. */
export function getArtworkGridImageSizes(
  ratios: number[],
  options: { fillRows?: boolean; groupWideWorks?: boolean; swipeOnTablet?: boolean },
) {
  const modes: GridMode[] = ["desktop", "tablet", "mobile"];
  const rows = Object.fromEntries(modes.map((mode) => [
    mode, packArtworkRows(ratios, mode, options),
  ])) as Record<GridMode, ArtworkRow[]>;

  return ratios.map((ratio, index) => {
    const slots = Object.fromEntries(modes.map((mode) => [
      mode, rowSlot(rows[mode].find((row) => row.indexes.includes(index))!, index, mode),
    ])) as Record<GridMode, ReturnType<typeof rowSlot>>;
    // All three CSS layouts use this same sizes string, so their resource hints
    // deduplicate and a hidden layout cannot request another, larger variant.
    const sizes = [
      // Never enlarge downloads beyond the existing approved image budget.
      // Narrow cards get a correctly sized source; wide cards retain theirs.
      `(min-width: 1600px) min(40vw, ${slots.desktop.capped})`,
      `(min-width: 1280px) min(40vw, ${slots.desktop.fluid})`,
      `(min-width: 861px) min(50vw, ${slots.tablet.fluid})`,
      ...(options.groupWideWorks ? [
        `(min-width: 600px) min(70vw, ${rowSlot(rows.tablet.find((row) => row.indexes.includes(index))!, index, "mobile").fluid})`,
      ] : []),
      `min(70vw, ${slots.mobile.fluid})`,
    ];
    if (options.swipeOnTablet) {
      // Mirrors the related-work strip's 240–320px image height and width cap.
      const strip = `min(calc(100vw - 72px), max(160px, clamp(${240 * ratio}px, ${34 * ratio}vw, ${320 * ratio}px)))`;
      sizes.unshift(`(pointer: coarse) and (max-width: 1366px) min(40vw, ${strip})`);
      sizes.unshift(`(max-width: 1279px) min(50vw, ${strip})`);
      sizes.unshift(`(max-width: 860px) min(70vw, ${strip})`);
    }
    return sizes.join(", ");
  });
}
