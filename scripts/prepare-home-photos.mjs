import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// The opening work already has its own preloaded, fingerprinted photo set.
const sources = [
  ["shakyamuni", "1790512251411-shakyamuni-14c-40cm-main.jpg"],
  ["manjushri", "1790500926274-manjushri-expounding-dharma-main.jpg"],
  ["drakpa", "1790513157066-drakpa-gyaltsen-silver-main.jpg"],
  ["mandala", "1790510421533-vajrapani-mahachakra-mandala-main.jpg"],
];
const publicDir = new URL("../public/", import.meta.url);
const photos = [];
for (const [name, file] of sources) {
  const source = "/uploads/artworks/" + file;
  const original = await readFile(new URL(source.slice(1), publicDir));
  const { width } = await sharp(original).metadata();
  const candidates = [];
  for (const w of new Set([480, 720, 864, 960, 1200, 1536, 1920].map(n => Math.min(width, n)))) {
    const encoded = await sharp(original).rotate().resize({ width: w })
      .avif({ quality: name === "mandala" ? 60 : 57, effort: 5 }).toBuffer();
    const hash = createHash("sha256").update(encoded).digest("hex").slice(0, 10);
    const path = "/uploads/home/" + name + "-" + w + "-" + hash + ".avif";
    await writeFile(new URL(path.slice(1), publicDir), encoded);
    candidates.push({ path, w });
  }
  const preview = await sharp(original).rotate().resize({ width: 80 }).webp({ quality: 54 }).toBuffer();
  photos.push({
    source, type: "image/avif", href: candidates[0].path,
    srcSet: candidates.map(({ path, w }) => path + " " + w + "w").join(", "),
    preview: "data:image/webp;base64," + preview.toString("base64"),
  });
}
const manifest = fileURLToPath(new URL("../lib/data/home-slide-photos.json", import.meta.url));
await writeFile(manifest, JSON.stringify(photos, null, 2) + "\n");
