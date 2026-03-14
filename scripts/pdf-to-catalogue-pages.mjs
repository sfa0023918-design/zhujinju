import { access, mkdir, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

function printUsage() {
  console.log("Usage:");
  console.log("  node scripts/pdf-to-catalogue-pages.mjs <input.pdf> <output-dir> [prefix]");
  console.log("");
  console.log("Example:");
  console.log("  node scripts/pdf-to-catalogue-pages.mjs ./catalogues/2025.pdf ./public/uploads/catalogues/silent-radiance page");
}

async function ensureReadable(filePath) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} failed with exit code ${result.status}`);
  }
}

function commandExists(command) {
  const result = spawnSync("which", [command], { encoding: "utf8" });
  return result.status === 0;
}

function toPublicUrl(targetPath) {
  const normalized = targetPath.split(path.sep).join("/");
  const publicIndex = normalized.lastIndexOf("/public/");

  if (publicIndex < 0) {
    return null;
  }

  return normalized.slice(publicIndex + "/public".length);
}

async function main() {
  const [inputPdf, outputDir, prefix = "page"] = process.argv.slice(2);

  if (!inputPdf || !outputDir) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!commandExists("pdftoppm")) {
    throw new Error("Missing dependency: pdftoppm. Install Poppler first, for example: brew install poppler");
  }

  const absoluteInput = path.resolve(inputPdf);
  const absoluteOutputDir = path.resolve(outputDir);

  await ensureReadable(absoluteInput);
  await mkdir(absoluteOutputDir, { recursive: true });

  const tempPrefix = path.join(absoluteOutputDir, "__catalogue-page");

  run("pdftoppm", [
    "-jpeg",
    "-r",
    "180",
    "-jpegopt",
    "quality=88,progressive=y,optimize=y",
    absoluteInput,
    tempPrefix,
  ]);

  const generatedFiles = (await readdir(absoluteOutputDir))
    .filter((file) => file.startsWith("__catalogue-page-") && file.endsWith(".jpg"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

  if (!generatedFiles.length) {
    throw new Error("No page images were generated.");
  }

  const renamedFiles = [];

  for (const [index, file] of generatedFiles.entries()) {
    const targetName = `${prefix}-${String(index + 1).padStart(3, "0")}.jpg`;
    await rename(path.join(absoluteOutputDir, file), path.join(absoluteOutputDir, targetName));
    renamedFiles.push(targetName);
  }

  const manifest = {
    sourcePdf: absoluteInput,
    outputDir: absoluteOutputDir,
    generatedAt: new Date().toISOString(),
    pageCount: renamedFiles.length,
    pages: renamedFiles.map((file) => toPublicUrl(path.join(absoluteOutputDir, file)) ?? file),
  };

  await writeFile(
    path.join(absoluteOutputDir, "catalogue-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  console.log(`Generated ${renamedFiles.length} catalogue pages in ${absoluteOutputDir}`);
  console.log("");
  console.log("Page URLs:");
  manifest.pages.forEach((pageUrl) => {
    console.log(`- ${pageUrl}`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
