// Read-only source measurement for lib/data/artwork-image-sizes.json.
// Run from the repository root; redirect stdout to update the generated map.
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const content = JSON.parse(await readFile("content/site-content.json", "utf8"));
const sizes = {};
for (const artwork of content.artworks) {
  for (const image of artwork.gallery ?? []) {
    if (!image.startsWith("/uploads/") || sizes[image]) continue;
    const source = path.join("public", decodeURIComponent(image));
    const { width, height } = await sharp(source).metadata();
    if (!width || !height)
      throw new Error(`Missing image dimensions: ${image}`);
    sizes[image] = [width, height];
  }
}
process.stdout.write(`${JSON.stringify(sizes, null, 2)}\n`);
