import { promises as fs } from "fs";
import path from "path";

import type { ImageAsset } from "./data/types";
import { putRepoBinaryFile } from "./github-repo";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};
const MAX_SERVER_UPLOAD_BYTES = 4 * 1024 * 1024;

function slugifyFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
}

function sanitizeFolder(folder: string) {
  return folder
    .split("/")
    .map((segment) => slugifyFilePart(segment))
    .filter(Boolean)
    .join("/");
}

function getExtension(file: File) {
  const inferred = IMAGE_EXTENSIONS[file.type];

  if (inferred) {
    return inferred;
  }

  const sourceExt = path.extname(file.name).toLowerCase();
  return sourceExt || ".jpg";
}

function assertImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("仅支持上传图片文件。");
  }

  if (file.size > MAX_SERVER_UPLOAD_BYTES) {
    throw new Error("单张图片请控制在 4MB 以内。");
  }
}

async function saveUploadedImage(
  file: File,
  folder: string,
  actor: string,
  fileName: string,
) {
  const sanitizedFolder = sanitizeFolder(folder) || "misc";
  const repoPath = path.posix.join("public", "uploads", sanitizedFolder, fileName);
  const publicUrl = path.posix.join("/uploads", sanitizedFolder, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.NODE_ENV !== "production") {
    const localDir = path.join(UPLOADS_DIR, sanitizedFolder);
    await fs.mkdir(localDir, { recursive: true });
    await fs.writeFile(path.join(localDir, fileName), buffer);
  }

  await putRepoBinaryFile(repoPath, buffer, `Upload ${repoPath} from admin by ${actor}`);

  return publicUrl;
}

type UploadAdminImageVariants = {
  card?: File | null;
};

type UploadAdminImageOptions = {
  width?: number;
  height?: number;
};

export async function uploadAdminImage(
  file: File,
  folder: string,
  actor: string,
  variants?: UploadAdminImageVariants,
  options?: UploadAdminImageOptions,
) {
  assertImageFile(file);
  if (variants?.card) {
    assertImageFile(variants.card);
  }

  const ext = getExtension(file);
  const baseName = slugifyFilePart(path.basename(file.name, path.extname(file.name)));
  const baseFileName = `${Date.now()}-${baseName}`;
  const originalUrl = await saveUploadedImage(file, folder, actor, `${baseFileName}${ext}`);
  const cardUrl = variants?.card
    ? await saveUploadedImage(variants.card, folder, actor, `${baseFileName}-card${getExtension(variants.card)}`)
    : undefined;
  const asset: ImageAsset = {
    original: originalUrl,
    card: cardUrl ?? originalUrl,
    detail: originalUrl,
    hero: originalUrl,
    width: options?.width,
    height: options?.height,
  };

  return {
    url: originalUrl,
    fileName: `${baseFileName}${ext}`,
    asset,
    message: "图片已上传成功。若已绑定到正式内容，系统会继续同步到正式站，请勿重复上传同一张图。",
  };
}
