export type ArtworkRow = {
  indexes: number[];
  ratios: number[];
  spacer: number;
};

/** Approved equal-height packing: preserve order, close on threshold/count. */
export function packArtworkRows(
  ratios: number[],
  mode: "desktop" | "tablet" | "mobile" | "details",
  options: { fillRows?: boolean; groupWideWorks?: boolean } = {},
): ArtworkRow[] {
  const target = mode === "desktop" ? 2.75 : mode === "details" ? 2.3 : 2;
  const limit = options.groupWideWorks && mode === "tablet" ? 2 :
    mode === "desktop" || mode === "details" ? 5 : mode === "tablet" ? 4 : 2;
  const solo = options.groupWideWorks && mode !== "mobile" ? Infinity :
    mode === "desktop"
      ? 2.6
      : mode === "tablet"
        ? 1.9
        : mode === "details"
          ? Infinity
          : 1.5;
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
  if (options.fillRows) {
    // Rebalance sparse collection rows without changing the artwork order.
    // Detail strips keep the original capped-height/spacer behavior by default.
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.spacer) continue;
      const previous = rows[i - 1];
      const next = rows[i + 1];
      const isWide = (candidate: ArtworkRow) =>
        candidate.ratios.length === 1 && candidate.ratios[0] >= solo;

      if (previous && !isWide(previous)) {
        const allIndexes = [...previous.indexes, ...row.indexes];
        const allRatios = [...previous.ratios, ...row.ratios];
        if (allIndexes.length <= limit) {
          previous.indexes = allIndexes;
          previous.ratios = allRatios;
          previous.spacer = 0;
          rows.splice(i, 1);
          i--;
          continue;
        }
        // A full row plus a lone tail becomes two balanced rows.
        const split = Math.ceil(allIndexes.length / 2);
        previous.indexes = allIndexes.slice(0, split);
        previous.ratios = allRatios.slice(0, split);
        row.indexes = allIndexes.slice(split);
        row.ratios = allRatios.slice(split);
      } else if (next && mode !== "mobile" && row.indexes.length + next.indexes.length <= limit) {
        row.indexes.push(...next.indexes);
        row.ratios.push(...next.ratios);
        rows.splice(i + 1, 1);
      }
    }
    rows.forEach((row) => { row.spacer = 0; });
  }
  return rows;
}
