import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

test("artwork display variants match their immutable keys and advertised pixel widths", async () => {
  const manifest = JSON.parse(await readFile(new URL("../lib/data/artwork-display.json", import.meta.url)));
  for (const [source, { key, width }] of Object.entries(manifest.photos)) {
    const hash = createHash("sha256");
    for (const size of new Set(manifest.widths.map(value => Math.min(value, width)))) {
      const photo = await readFile(new URL(`../public/uploads/display/${key}-${size}.avif`, import.meta.url));
      const metadata = await sharp(photo).metadata();
      assert.equal(metadata.width, size, source);
      hash.update(photo);
    }
    assert.equal(hash.digest("hex").slice(0, 16), key, source);
  }
});
