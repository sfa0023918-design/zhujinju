import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(
  new URL("../lib/data/catalogue-pages.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const loaded = { exports: {} };
vm.runInNewContext(`(function(exports) {${compiled}\n})`)(loaded.exports);
const { getArtworkCatalogueReference: resolve } = loaded.exports;
const content = JSON.parse(
  fs.readFileSync(
    new URL("../content/site-content.json", import.meta.url),
    "utf8",
  ),
);
// Plate targets independently checked against all 66 object photographs and the
// 2023–2026 online catalogue pages. Includes the shortened 2023 digital edition.
const verified = JSON.parse(
  fs.readFileSync(
    new URL("./fixtures/artwork-catalogue-references.json", import.meta.url),
    "utf8",
  ),
);

test("every published artwork opens its visually verified catalogue plates", () => {
  const artworks = content.artworks.filter(
    (artwork) => artwork.publicationStatus !== "draft",
  );
  assert.equal(artworks.length, 66);
  assert.equal(verified.length, artworks.length);
  for (const artwork of artworks) {
    const expected = verified.find((item) => item.slug === artwork.slug);
    const reference = resolve(artwork, content.exhibitions);
    assert.ok(expected, `Missing reviewed target: ${artwork.slug}`);
    assert.ok(reference, `Missing catalogue: ${artwork.slug}`);
    assert.deepEqual(
      Array.from(reference.images),
      expected.images,
      artwork.slug,
    );
    assert.deepEqual(
      Array.from(reference.pages),
      [expected.pages[0], expected.pages.at(-1)],
      artwork.slug,
    );
    const [path, hash] = reference.href.split("#catalogue-p");
    const exhibition = content.exhibitions.find(
      (item) => path === `/exhibitions/${item.slug}`,
    );
    assert.ok(exhibition.catalogueTitle.zh.includes(String(expected.year)));
    assert.equal(
      exhibition.cataloguePageImages[Number(hash) - 1],
      expected.images[0],
    );
    for (const image of reference.images) {
      assert.ok(
        fs.existsSync(new URL(`../public${image}`, import.meta.url)),
        image,
      );
    }
  }
});

test("2023 deleted pages use verified plate positions, with the facing photograph", () => {
  for (const [slug, plate] of [
    ["artwork-1773413231185", "090"],
    ["artwork-1773413771882", "096"],
    ["artwork-1773411481711", "116"],
  ]) {
    const artwork = content.artworks.find((item) => item.slug === slug);
    const reference = resolve(artwork, content.exhibitions);
    assert.equal(reference.images.length, 2);
    assert.ok(reference.images[0].endsWith(`page-${plate}.jpg`));
  }
});

test("2025 standing Buddha opens the object on printed page 14, not the preface", () => {
  const artwork = content.artworks.find(
    (item) => item.slug === "artwork-1773426593712",
  );
  const reference = resolve(artwork, content.exhibitions);
  assert.equal(reference.pages[0], 14);
  assert.equal(reference.href, "/exhibitions/silent-radiance#catalogue-p7");
});

test("missing, unsupported or unpublished catalogue data never invents an entry", () => {
  const artwork = structuredClone(content.artworks[0]);
  assert.equal(resolve({ publications: [] }, content.exhibitions), undefined);
  for (const pages of ["", "未详", "第29–26页", "第0页", "第999页"]) {
    artwork.publications[0].pages = { zh: pages, en: "" };
    assert.equal(resolve(artwork, content.exhibitions), undefined);
  }
  const original = content.artworks[0];
  assert.equal(resolve(original, []), undefined);
  assert.equal(
    resolve(
      original,
      content.exhibitions.map((item) => ({
        ...item,
        publicationStatus: "draft",
      })),
    ),
    undefined,
  );
  assert.equal(
    resolve(
      original,
      content.exhibitions.map((item) => ({ ...item, cataloguePageImages: [] })),
    ),
    undefined,
  );
  artwork.publications[0].pages = { zh: "第14页", en: "" };
  artwork.publications[0].year = "2022";
  assert.equal(resolve(artwork, content.exhibitions), undefined);
});

test("latest available catalogue wins without changing stored publication order", () => {
  const old = content.artworks
    .find((item) => item.slug === "artwork-1773203033967")
    .publications.at(-1);
  const recent = content.artworks[0].publications.at(-1);
  const artwork = { publications: [old, recent] };
  const before = JSON.stringify(artwork);
  assert.ok(
    resolve(artwork, content.exhibitions).href.includes("himalayan-art-2026"),
  );
  assert.ok(
    resolve(
      artwork,
      content.exhibitions.filter((item) => item.slug !== "himalayan-art-2026"),
    ).href.includes("silent-radiance"),
  );
  assert.equal(JSON.stringify(artwork), before);
});

test("English-only page labels and single-page citations are retained", () => {
  const artwork = structuredClone(content.artworks[0]);
  artwork.publications[0].pages = { zh: "", en: "Pages 26–29" };
  assert.deepEqual(
    Array.from(resolve(artwork, content.exhibitions).pages),
    [26, 29],
  );
  artwork.publications[0].pages.en = "p. 26";
  assert.deepEqual(
    Array.from(resolve(artwork, content.exhibitions).pages),
    [26, 26],
  );
});

test("empty CMS slots do not shift the reader's page hashes", () => {
  const exhibitions = structuredClone(content.exhibitions);
  const edition = exhibitions.find((item) => item.slug === "himalayan-art-2026");
  edition.cataloguePageImages.unshift("");
  edition.cataloguePageImages.splice(5, 0, "");
  const artwork = content.artworks.find((item) => item.slug === "artwork-1790512216778");
  assert.equal(resolve(artwork, exhibitions).href, "/exhibitions/himalayan-art-2026#catalogue-p74");
});
