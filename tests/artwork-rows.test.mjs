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
const pack = (ratios, mode) =>
  JSON.parse(JSON.stringify(loaded.exports.packArtworkRows(ratios, mode)));
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
