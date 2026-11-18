import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const directory = new URL("../public/uploads/artworks/", import.meta.url);
const source = await readFile(new URL("five-pronged-vajra-cover-cutout-2026.png", directory));
const candidates = [];
for (const width of [480, 768, 1200, 1728]) {
  const buffer = await sharp(source).resize({ width }).avif({ quality: 69, effort: 5 }).toBuffer();
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 10);
  const name = `five-pronged-vajra-cover-${width}-${hash}.avif`;
  await writeFile(new URL(name, directory), buffer);
  candidates.push({ href: "/uploads/artworks/" + name, width });
}
const photo = {
  type: "image/avif",
  href: candidates[0].href,
  srcSet: candidates.map(({ href, width }) => `${href} ${width}w`).join(", "),
};
await writeFile(new URL("../lib/data/exhibition-cover-photo.json", import.meta.url), JSON.stringify(photo, null, 2) + "\n");
