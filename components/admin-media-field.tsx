"use client";

import Image from "next/image";
import { useId, useState } from "react";

const SAFE_UPLOAD_BYTES = Math.floor(3.5 * 1024 * 1024);
const MAX_IMAGE_DIMENSION = 2400;
const DISPLAY_UPLOAD_LIMIT = "4MB";

type AdminMediaFieldProps = {
  label: string;
  note?: string;
  folder: string;
  value: string;
  onChange: (value: string) => void;
  previewRatio?: "portrait" | "landscape" | "square";
  recommendedSize?: string;
  recommendedUse?: string;
};

export function AdminMediaField({
  label,
  note,
  folder,
  value,
  onChange,
  previewRatio = "portrait",
  recommendedSize,
  recommendedUse,
}: AdminMediaFieldProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  async function readUploadResponse(response: Response) {
    const raw = await response.text();

    try {
      return {
        payload: JSON.parse(raw) as { url?: string; message?: string; error?: string },
        raw,
      };
    } catch {
      return {
        payload: {} as { url?: string; message?: string; error?: string },
        raw,
      };
    }
  }

  async function loadImageForCompression(file: File) {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const nextImage = new window.Image();

      nextImage.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(nextImage);
      };

      nextImage.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("浏览器未能读取这张图片，请换一张图片后再试。"));
      };

      nextImage.src = objectUrl;
    });
  }

  async function compressImageIfNeeded(file: File) {
    if (file.size <= SAFE_UPLOAD_BYTES) {
      return { file, compressed: false };
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("仅支持上传图片文件。");
    }

    if (file.type === "image/svg+xml" || file.type === "image/gif") {
      throw new Error(`当前图片文件过大。请改用 ${DISPLAY_UPLOAD_LIMIT} 以内的 JPG、PNG 或 WebP 图片后再上传。`);
    }

    const image = await loadImageForCompression(file);
    let scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    let width = Math.max(1, Math.round(image.width * scale));
    let height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("当前浏览器无法处理图片压缩，请换一张更小的图片后再试。");
    }

    const targetType = file.type === "image/png" ? "image/webp" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
    const qualitySteps = [0.9, 0.84, 0.78, 0.72, 0.66];
    let bestBlob: Blob | null = null;

    for (let resizeRound = 0; resizeRound < 3; resizeRound += 1) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualitySteps) {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, targetType, quality);
        });

        if (!blob) {
          continue;
        }

        bestBlob = blob;

        if (blob.size <= SAFE_UPLOAD_BYTES) {
          const extension = targetType === "image/webp" ? "webp" : "jpg";
          const normalizedName = file.name.replace(/\.[^.]+$/, "") || "upload";
          return {
            file: new File([blob], `${normalizedName}.${extension}`, {
              type: blob.type,
              lastModified: Date.now(),
            }),
            compressed: true,
          };
        }
      }

      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
    }

    if (bestBlob) {
      throw new Error(`图片仍然过大。建议先裁切或压缩到 ${DISPLAY_UPLOAD_LIMIT} 以内再上传。`);
    }

    throw new Error("图片压缩失败，请更换一张图片后再试。");
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);
    setLocalPreview(URL.createObjectURL(file));

    try {
      const prepared = await compressImageIfNeeded(file);
      const formData = new FormData();
      formData.append("file", prepared.file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const { payload, raw } = await readUploadResponse(response);

      if (!response.ok || !payload.url) {
        if (response.status === 413 || /request entity too large/i.test(raw)) {
          throw new Error(`图片过大，上传请求被服务器拒绝。系统建议使用 ${DISPLAY_UPLOAD_LIMIT} 以内的 JPG、PNG 或 WebP 图片。`);
        }

        throw new Error(payload.error ?? (raw.trim() || "图片上传失败。"));
      }

      onChange(payload.url);
      setLocalPreview(null);
      setMessage(
        prepared.compressed
          ? "图片已自动压缩并上传。保存当前内容后，网站会在下一次部署完成后显示新图片。"
          : payload.message ?? "图片上传成功。",
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const previewClassName =
    previewRatio === "landscape"
      ? "aspect-[1.45/1]"
      : previewRatio === "square"
        ? "aspect-square"
        : "aspect-[4/5]";

  return (
    <div className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="space-y-1">
        <label htmlFor={inputId} className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">
          {label}
        </label>
        {note ? <p className="text-xs leading-6 text-[var(--muted)]">{note}</p> : null}
        {recommendedUse || recommendedSize ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-6 text-[var(--accent)]/82">
            {recommendedUse ? <p>{`用途：${recommendedUse}`}</p> : null}
            {recommendedSize ? <p>{`建议尺寸：${recommendedSize}`}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="overflow-hidden bg-[var(--surface-strong)]">
          {localPreview || value ? (
            <Image
              src={localPreview ?? value}
              alt={label}
              width={800}
              height={1000}
              unoptimized
              className={`${previewClassName} h-full w-full object-cover`}
            />
          ) : (
            <div className={`flex ${previewClassName} items-center justify-center text-xs tracking-[0.16em] text-[var(--accent)]`}>
              暂无图片
            </div>
          )}
        </div>

        <div className="space-y-4">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="可粘贴现有图片地址，或下方上传本地图片"
            className="min-h-11 w-full border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
          <div className="flex flex-wrap gap-3">
            <label
              htmlFor={inputId}
              className={`inline-flex min-h-11 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors ${
                uploading ? "cursor-wait opacity-72" : "cursor-pointer hover:bg-[var(--surface-strong)]"
              }`}
            >
              {uploading ? "上传中..." : "上传本地图片"}
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => {
                setLocalPreview(null);
                setMessage(null);
                setError(null);
                onChange("");
              }}
              className="inline-flex min-h-11 items-center border border-[var(--line)] px-4 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
            >
              清空图片
            </button>
          </div>
          {message ? <p className="text-sm leading-7 text-[var(--muted)]">{message}</p> : null}
          {error ? <p className="text-sm leading-7 text-[#8e4e3b]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
