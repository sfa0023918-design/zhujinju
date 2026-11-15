import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
const loaded = { exports: {} };
const compiled = ts.transpileModule(
  fs.readFileSync(new URL("../lib/artwork-rows.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
vm.runInNewContext(`(function(exports,module){${compiled}\n})`)(
  loaded.exports,
  loaded,
);
const pack = (ratios, mode, options) =>
  JSON.parse(JSON.stringify(loaded.exports.packArtworkRows(ratios, mode, options)));
test("approved reference sequence keeps order across wide standalone works", () => {
  const rows = pack(
    [
      0.849, 1.72, 0.435, 0.847, 0.778, 0.837, 0.587, 3.488, 0.936, 0.824,
      0.849, 0.67, 1.695, 0.82, 0.849,
    ],
    "desktop",
  );
  assert.deepEqual(
    rows.map((row) => row.indexes.length),
    [3, 4, 1, 4, 3],
  );
  assert.deepEqual(
    rows.flatMap((row) => row.indexes),
    Array.from({ length: 15 }, (_, i) => i),
  );
  assert.equal(rows[2].spacer, 0);
});
test("mobile lone works occupy half a row while wide works remain standalone", () => {
  const rows = pack([0.8, 1.7, 0.6, 0.9, 0.7], "mobile");
  assert.deepEqual(
    rows.map((row) => row.indexes),
    [[0], [1], [2, 3], [4]],
  );
  assert.deepEqual(
    rows.map((row) => row.spacer),
    [0.8, 0, 0, 0.7],
  );
});
test("short desktop tail uses preceding row ratio without inflating images", () => {
  const rows = pack([1, 1, 1, 0.8], "desktop");
  assert.equal(rows[1].spacer, 2.2);
  assert.deepEqual(pack([], "desktop"), []);
});

test("detail rows retain sequence, cap five images, and avoid enlarged tails", () => {
  const rows = pack([0.4, 0.4, 0.4, 0.4, 0.4, 0.8, 0.8, 0.8, 0.7], "details");
  assert.deepEqual(
    rows.map((row) => row.indexes),
    [[0, 1, 2, 3, 4], [5, 6, 7], [8]],
  );
  assert.ok(Math.abs(rows[0].spacer - 0.3) < 1e-10);
  assert.ok(Math.abs(rows[2].spacer - 1.7) < 1e-10);
  assert.deepEqual(
    pack([0.8, 3.5], "details").map((row) => row.indexes),
    [[0, 1]],
  );
});

test("filled collection rows absorb the narrow-window lone portrait and keep order", () => {
  const rows = pack([0.849, 1.72, 0.435, 0.847, 0.778, 0.837], "tablet", { fillRows: true });
  assert.deepEqual(rows.map((row) => row.indexes), [[0, 1], [2, 3, 4, 5]]);
  assert.ok(rows.every((row) => row.spacer === 0));
  const secondPage = pack([0.587, 3.488, 0.936, 0.824, 0.849, 0.67], "tablet", { fillRows: true });
  assert.deepEqual(secondPage.map((row) => row.indexes), [[0, 1], [2, 3, 4, 5]]);
});

test("all collection pages fill every row at every layout breakpoint", () => {
  const content = JSON.parse(fs.readFileSync(new URL("../content/site-content.json", import.meta.url), "utf8"));
  const ratios = content.artworks.filter((item) => item.publicationStatus !== "draft").map((item) =>
    (item.imageAsset?.width ?? 800) / (item.imageAsset?.height ?? 1000));
  for (const mode of ["desktop", "tablet", "mobile"]) {
    const count = mode === "desktop" ? 15 : 6;
    for (let i = 0; i < ratios.length; i += count) {
      const page = ratios.slice(i, i + count);
      const rows = pack(page, mode, { fillRows: true });
      assert.deepEqual(rows.flatMap((row) => row.indexes), page.map((_, index) => index));
      assert.ok(rows.every((row) => row.spacer === 0));
    }
  }
  const reference = pack([0.849, 1.72, 0.435, 0.847, 0.778, 0.837, 0.587, 3.488, 0.936, 0.824, 0.849, 0.67, 1.695, 0.82, 0.849], "desktop", { fillRows: true });
  assert.deepEqual(reference.map((row) => row.indexes.length), [3, 4, 1, 4, 3]);
});

test("recommendations preserve order and fill rows around wide works on every screen", () => {
  for (const ratios of [[0.8, 0.6], [0.8, 3.5, 0.6, 0.8], [3.5, 0.6], [1.7, 0.6, 3.5, 0.8]]) {
    for (const mode of ["desktop", "tablet", "mobile"]) {
      const rows = pack(ratios, mode, { fillRows: true, groupWideWorks: true });
      assert.deepEqual(rows.flatMap(row => row.indexes), ratios.map((_, index) => index));
      assert.ok(rows.every(row => row.spacer === 0));
      if (mode !== "mobile") assert.ok(rows.every(row => row.indexes.length > 1));
    }
  }
});
