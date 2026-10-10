import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/catalogue-reading.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
vm.runInNewContext(`(function(exports) {${compiled}\n})`)(loaded.exports);
const { moveCataloguePosition: move, clampCataloguePan: pan } = loaded.exports;
const plain = (value) => JSON.parse(JSON.stringify(value));
const content = JSON.parse(fs.readFileSync(new URL("../content/site-content.json", import.meta.url), "utf8"));
const assets = JSON.parse(fs.readFileSync(new URL("../lib/catalogue-reader-assets.json", import.meta.url), "utf8"));
const layoutsFor = (slug) => content.exhibitions.find((item) => item.slug === slug).cataloguePageImages.map((source) => assets[source]);
const layouts2026 = layoutsFor("himalayan-art-2026");

test("portrait traversal skips the blank cover and visits every remaining half in reading order", () => {
  let position = { index: 0, half: 1 };
  const visited = [position];
  for (let i = 0; i < 240; i++) { position = move(position, 1, layouts2026, true, false); visited.push(plain(position)); }
  assert.equal(visited.length, 241);
  assert.equal(new Set(visited.map(({ index, half }) => `${index}:${half}`)).size, 241);
  assert.deepEqual(plain(position), { index: 120, half: 1 });
  assert.deepEqual(plain(move(position, 1, layouts2026, true, false)), plain(position));
  for (let i = 0; i < 240; i++) position = move(position, -1, layouts2026, true, false);
  assert.deepEqual(plain(position), { index: 0, half: 1 });
  assert.deepEqual(plain(move(position, -1, layouts2026, true, false)), { index: 0, half: 1 });
});

test("landscape traverses complete spreads and respects both boundaries", () => {
  assert.deepEqual(plain(move({ index: 5, half: 1 }, 1, layouts2026, false, false)), { index: 6, half: 0 });
  assert.deepEqual(plain(move({ index: 1, half: 0 }, -1, layouts2026, false, false)), { index: 0, half: 1 });
  assert.equal(move({ index: 120, half: 1 }, 1, layouts2026, false, false).index, 120);
});

test("facing-page traversal visits every image exactly once across all annual catalogues", () => {
  for (const exhibition of content.exhibitions) {
    const layouts = layoutsFor(exhibition.slug);
    const paired = exhibition.catalogueViewMode !== "spread-images";
    let position = { index: 0, half: 0 };
    const visited = [];
    for (let step = 0; step < layouts.length; step++) {
      visited.push(position.index);
      if (paired && position.index + 1 < layouts.length) visited.push(position.index + 1);
      const next = move(position, 1, layouts, false, paired);
      if (next.index === position.index) break;
      position = next;
    }
    assert.deepEqual(visited, Array.from({ length: layouts.length }, (_, index) => index), exhibition.slug);
    assert.equal(move(position, 1, layouts, false, paired).index, position.index);
    while (position.index > 0) position = move(position, -1, layouts, false, paired);
    assert.equal(position.index, 0);
    assert.equal(move(position, -1, layouts, false, paired).index, 0);
  }
});

test("ordinary spreads do not lose the first left page", () => {
  assert.deepEqual(plain(move({ index: 0, half: 1 }, -1, [{ spread: true }, { spread: true }], true, false)), { index: 0, half: 0 });
});

test("2024 and 2025 retain their single final page without slicing it or visiting it twice", () => {
  for (const slug of ["silent-radiance", "exhibition-1773394358822"]) {
    const layouts = layoutsFor(slug);
    const last = layouts.length - 1;
    assert.equal(layouts[last].spread, false);
    assert.deepEqual(plain(move({ index: last - 1, half: 1 }, 1, layouts, true, false)), { index: last, half: 0 });
    assert.deepEqual(plain(move({ index: last, half: 0 }, 1, layouts, true, false)), { index: last, half: 0 });
    assert.deepEqual(plain(move({ index: last, half: 0 }, -1, layouts, true, false)), { index: last - 1, half: 1 });
  }
});

test("2023 reads all 128 uncut pages in portrait and pairs them without duplicating the end in landscape", () => {
  const layouts = layoutsFor("exhibition-1773399222802");
  assert.ok(layouts.every(({ spread }) => !spread));
  let position = { index: 0, half: 0 };
  for (let i = 1; i < 128; i++) {
    position = move(position, 1, layouts, true, true);
    assert.deepEqual(plain(position), { index: i, half: 0 });
  }
  assert.deepEqual(plain(move(position, 1, layouts, true, true)), { index: 127, half: 0 });
  assert.deepEqual(plain(move({ index: 126, half: 0 }, 1, layouts, false, true)), { index: 126, half: 0 });
  assert.deepEqual(plain(move({ index: 124, half: 0 }, 1, layouts, false, true)), { index: 126, half: 0 });
  assert.deepEqual(plain(move({ index: 125, half: 0 }, 1, layouts.slice(0,127), false, true)), { index: 125, half: 0 });
});

test("every configured plate has real geometry and both derivative files", () => {
  for (const exhibition of content.exhibitions) {
    for (const source of exhibition.cataloguePageImages ?? []) {
      const asset = assets[source];
      assert.ok(asset?.width > 0 && asset?.height > 0, source);
      for (const variant of ["reader", "thumb"]) {
        assert.ok(fs.existsSync(new URL(`../public${asset[variant]}`, import.meta.url)), asset[variant]);
      }
    }
  }
});

test("pan bounds keep magnified page edges within the reading area and reset at fit", () => {
  assert.deepEqual(plain(pan(1000, -1000, 2.5, 390, 460)), { x: 292.5, y: -345 });
  assert.deepEqual(plain(pan(100, 100, 1, 390, 460)), { x: 0, y: 0 });
});
