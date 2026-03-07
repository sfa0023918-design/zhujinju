import { promises as fs } from "fs";
import path from "path";

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

export async function uploadAdminImage(file: File, folder: string, actor: string) {
  assertImageFile(file);

  const sanitizedFolder = sanitizeFolder(folder) || "misc";
  const ext = getExtension(file);
  const baseName = slugifyFilePart(path.basename(file.name, path.extname(file.name)));
  const fileName = `${Date.now()}-${baseName}${ext}`;
  const repoPath = path.posix.join("public", "uploads", sanitizedFolder, fileName);
  const publicUrl = path.posix.join("/uploads", sanitizedFolder, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.NODE_ENV !== "production") {
    const localDir = path.join(UPLOADS_DIR, sanitizedFolder);
    await fs.mkdir(localDir, { recursive: true });
    await fs.writeFile(path.join(localDir, fileName), buffer);
  }

  await putRepoBinaryFile(repoPath, buffer, `Upload ${repoPath} from admin by ${actor}`);

  return {
    url: publicUrl,
    fileName,
    message: "图片已上传。保存当前内容后，网站会在下一次部署完成后显示新图片。",
  };
}
