import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// CSS raster masks use only alpha. Keep every original opacity value and
// dimension, without shipping the unused photographic RGB channels.
const root = new URL("../public/uploads/artworks/", import.meta.url);
const results = [];
for (const index of [1, 2, 3]) {
  const source = fileURLToPath(new URL(`five-pronged-vajra-detail-${index}-mask-2026.png`, root));
  const target = fileURLToPath(new URL(`five-pronged-vajra-detail-${index}-alpha-mask-20261117.png`, root));
  const { data: alpha, info } = await sharp(source).extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4, 255);
  for (let pixel = 0; pixel < alpha.length; pixel++) rgba[pixel * 4 + 3] = alpha[pixel];
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(target);
  const verified = await sharp(target).extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
  assert.equal(verified.info.width, info.width);
  assert.equal(verified.info.height, info.height);
  assert.ok(alpha.equals(verified.data), `Mask ${index} opacity must remain identical`);
  results.push({ index, originalBytes: (await stat(source)).size, optimizedBytes: (await stat(target)).size, width: info.width, height: info.height, alphaIdentical: true });
}
console.log(JSON.stringify(results, null, 2));
