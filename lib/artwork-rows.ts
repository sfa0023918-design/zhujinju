export type ArtworkRow = {
  indexes: number[];
  ratios: number[];
  spacer: number;
};

/** Approved equal-height packing: preserve order, close on threshold/count. */
export function packArtworkRows(
  ratios: number[],
  mode: "desktop" | "tablet" | "mobile",
): ArtworkRow[] {
  const target = mode === "desktop" ? 2.75 : 2;
  const limit = mode === "desktop" ? 5 : mode === "tablet" ? 4 : 2;
  const solo = mode === "desktop" ? 2.6 : mode === "tablet" ? 1.9 : 1.5;
  const rows: ArtworkRow[] = [];
  let indexes: number[] = [];
  let current: number[] = [];
  let previousSum = target;
  const finish = (standalone = false) => {
    if (!current.length) return;
    const sum = current.reduce((a, b) => a + b, 0);
    const spacer = standalone
      ? 0
      : mode === "mobile"
        ? current.length === 1
          ? current[0]
          : 0
        : sum < target
          ? Math.max(target, previousSum) - sum
          : 0;
    rows.push({ indexes, ratios: current, spacer });
    previousSum = sum;
    indexes = [];
    current = [];
  };
  ratios.forEach((value, index) => {
    const ratio = Number.isFinite(value) && value > 0 ? value : 0.8;
    if (ratio >= solo) {
      finish();
      indexes = [index];
      current = [ratio];
      finish(true);
    } else {
      indexes.push(index);
      current.push(ratio);
      if (
        current.length >= limit ||
        (mode !== "mobile" && current.reduce((a, b) => a + b, 0) >= target)
      )
        finish();
    }
  });
  finish();
  return rows;
}
