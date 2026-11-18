import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const data = JSON.parse(await readFile(path.join(root, "content/site-content.json"), "utf8"));
const directory = path.join(root, "public/uploads/display");
const widths = [480, 828, 1200, 1728, 1920];
const manifest = {};
await mkdir(directory, { recursive: true });

const sources = new Set(data.artworks.filter(work => work.publicationStatus === "published")
  .map(work => [work.image, work.imageAsset?.original, work.imageAsset?.hero,
    work.imageAsset?.detail, work.imageAsset?.card].find(value => value?.trim())?.trim())
  .filter(source => source?.startsWith("/uploads/")));

async function prepare(source) {
  const input = path.resolve(root, "public", "." + source);
  if (!input.startsWith(path.join(root, "public/uploads/"))) return;
  const bytes = await readFile(input);
  const meta = await sharp(bytes).metadata();
  const width = meta.autoOrient.width;
  const sizes = [...new Set(widths.map(value => Math.min(value, width)))];
  const images = [];
  for (const size of sizes) {
    // Match Next's existing AVIF rendition for a quality-85 gallery image.
    const avif = await sharp(bytes).rotate().resize(size, undefined, { withoutEnlargement: true })
      .avif({ quality: 53, effort: 3 }).toBuffer();
    images.push(avif);
  }
  const hash = createHash("sha256");
  for (const image of images) hash.update(image);
  const key = hash.digest("hex").slice(0, 16);
  for (const [i, size] of sizes.entries()) {
    await writeFile(path.join(directory, key + "-" + size + ".avif"), images[i]);
  }
  manifest[source] = { key, width: sizes.at(-1) };
}

const queue = [...sources].sort();
for (let start = 0; start < queue.length; start += 3) {
  await Promise.all(queue.slice(start, start + 3).map(prepare));
}
const ordered = Object.fromEntries(Object.keys(manifest).sort().map(source => [source, manifest[source]]));
await writeFile(path.join(root, "lib/data/artwork-display.json"), JSON.stringify({ widths, photos: ordered }, null, 2) + "\n");
