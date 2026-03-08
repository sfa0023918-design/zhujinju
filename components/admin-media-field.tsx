"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const SAFE_UPLOAD_BYTES = Math.floor(3.5 * 1024 * 1024);
const DISPLAY_UPLOAD_LIMIT = "4MB";

type PreviewRatio = "portrait" | "landscape" | "square";
type TargetSize = {
  width: number;
  height: number;
};

type UploadSaveTarget = {
  section: "artworks";
  slug: string;
  field: "image" | "gallery";
  index?: number;
};

type AdminMediaFieldProps = {
  fieldKey?: string;
  label: string;
  note?: string;
  folder: string;
  value: string;
  onChange: (value: string) => void;
  autoSaveAfterUpload?: boolean;
  onRequestAutoSave?: () => void;
  previewRatio?: PreviewRatio;
  targetSize?: TargetSize;
  recommendedSize?: string;
  recommendedUse?: string;
  saveTarget?: UploadSaveTarget;
  disabled?: boolean;
  disabledHint?: string;
};

function getDefaultTargetSize(previewRatio: PreviewRatio): TargetSize {
  if (previewRatio === "landscape") {
    return { width: 1600, height: 1000 };
  }

  if (previewRatio === "square") {
    return { width: 1400, height: 1400 };
  }

  return { width: 1200, height: 1500 };
}

function getTargetOutputType(file: File) {
  if (file.type === "image/png" || file.type === "image/webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function createObjectUrl(fileOrBlob: Blob) {
  return URL.createObjectURL(fileOrBlob);
}

export function AdminMediaField({
  fieldKey,
  label,
  note,
  folder,
  value,
  onChange,
  autoSaveAfterUpload = true,
  onRequestAutoSave,
  previewRatio = "portrait",
  targetSize,
  recommendedSize,
  recommendedUse,
  saveTarget,
  disabled = false,
  disabledHint,
}: AdminMediaFieldProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [lastPersistedValue, setLastPersistedValue] = useState(value);

  const outputSize = useMemo(() => targetSize ?? getDefaultTargetSize(previewRatio), [previewRatio, targetSize]);
  const previewAspectRatio = useMemo(() => `${outputSize.width} / ${outputSize.height}`, [outputSize.height, outputSize.width]);
  const targetKey =
    fieldKey ??
    `${saveTarget?.section ?? "none"}:${saveTarget?.slug ?? "none"}:${saveTarget?.field ?? "none"}:${saveTarget?.index ?? "na"}`;
  const targetKeyRef = useRef(targetKey);

  useEffect(() => {
    if (targetKeyRef.current === targetKey) {
      return;
    }

    targetKeyRef.current = targetKey;
    setLastPersistedValue(value);
    setMessage(null);
    setError(null);
    replaceLocalPreview(null);
  }, [targetKey, value]);

  function replaceLocalPreview(nextPreview: string | null) {
    setLocalPreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }

      return nextPreview;
    });
  }

  async function readUploadResponse(response: Response) {
    const raw = await response.text();

    try {
      return {
        payload: JSON.parse(raw) as { url?: string; message?: string; error?: string; saved?: boolean },
        raw,
      };
    } catch {
      return {
        payload: {} as { url?: string; message?: string; error?: string; saved?: boolean },
        raw,
      };
    }
  }

  async function loadImage(file: File) {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = createObjectUrl(file);
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

  async function transformImage(file: File) {
    if (!file.type.startsWith("image/")) {
      throw new Error("仅支持上传图片文件。");
    }

    const image = await loadImage(file);
    const targetRatio = outputSize.width / outputSize.height;
    const sourceRatio = image.width / image.height;
    const needsCropping = Math.abs(sourceRatio - targetRatio) > 0.015;
    const needsResizing = image.width > outputSize.width || image.height > outputSize.height;
    const needsCompression = file.size > SAFE_UPLOAD_BYTES;
    const canKeepOriginal =
      !needsCropping &&
      !needsResizing &&
      !needsCompression &&
      file.type !== "image/gif" &&
      file.type !== "image/svg+xml";

    if (canKeepOriginal) {
      return {
        file,
        previewUrl: createObjectUrl(file),
        transformed: false,
        details: {
          cropped: false,
          resized: false,
          compressed: false,
        },
      };
    }

    const cropWidth = needsCropping
      ? sourceRatio > targetRatio
        ? image.height * targetRatio
        : image.width
      : image.width;
    const cropHeight = needsCropping
      ? sourceRatio > targetRatio
        ? image.height
        : image.width / targetRatio
      : image.height;
    const cropX = Math.max(0, (image.width - cropWidth) / 2);
    const cropY = Math.max(0, (image.height - cropHeight) / 2);
    const scale = Math.min(1, outputSize.width / cropWidth, outputSize.height / cropHeight);
    let exportWidth = Math.max(1, Math.round(cropWidth * scale));
    let exportHeight = Math.max(1, Math.round(cropHeight * scale));
    const outputType = getTargetOutputType(file);
    const outputExtension = outputType === "image/webp" ? "webp" : "jpg";
    const normalizedName = file.name.replace(/\.[^.]+$/, "") || "upload";
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("当前浏览器无法处理图片，请更换一张图片后再试。");
    }

    const qualitySteps = [0.92, 0.86, 0.8, 0.74, 0.68];
    let bestBlob: Blob | null = null;
    let bestPreviewUrl: string | null = null;

    for (let resizeRound = 0; resizeRound < 4; resizeRound += 1) {
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      context.clearRect(0, 0, exportWidth, exportHeight);
      context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, exportWidth, exportHeight);

      for (const quality of qualitySteps) {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, outputType, quality);
        });

        if (!blob) {
          continue;
        }

        bestBlob = blob;

        if (blob.size <= SAFE_UPLOAD_BYTES) {
          if (bestPreviewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(bestPreviewUrl);
          }

          return {
            file: new File([blob], `${normalizedName}.${outputExtension}`, {
              type: blob.type,
              lastModified: Date.now(),
            }),
            previewUrl: createObjectUrl(blob),
            transformed: true,
            details: {
              cropped: needsCropping,
              resized: needsResizing || resizeRound > 0,
              compressed: needsCompression || quality < 0.92,
            },
          };
        }
      }

      if (bestPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(bestPreviewUrl);
      }

      if (bestBlob) {
        bestPreviewUrl = createObjectUrl(bestBlob);
      }

      exportWidth = Math.max(960, Math.round(exportWidth * 0.88));
      exportHeight = Math.max(Math.round(960 / targetRatio), Math.round(exportHeight * 0.88));
    }

    if (bestBlob && bestBlob.size <= SAFE_UPLOAD_BYTES) {
      return {
        file: new File([bestBlob], `${normalizedName}.${outputExtension}`, {
          type: bestBlob.type,
          lastModified: Date.now(),
        }),
        previewUrl: bestPreviewUrl ?? createObjectUrl(bestBlob),
        transformed: true,
        details: {
          cropped: true,
          resized: true,
          compressed: true,
        },
      };
    }

    throw new Error(`系统已经自动裁切和压缩，但图片仍然过大。请换一张更清晰但尺寸更适中的图片，或先裁掉多余背景后再上传。`);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) {
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const prepared = await transformImage(file);
      replaceLocalPreview(prepared.previewUrl);

      const formData = new FormData();
      formData.append("file", prepared.file);
      formData.append("folder", folder);
      if (saveTarget) {
        formData.append("targetSection", saveTarget.section);
        formData.append("targetSlug", saveTarget.slug);
        formData.append("targetField", saveTarget.field);
        if (typeof saveTarget.index === "number") {
          formData.append("targetIndex", String(saveTarget.index));
        }
      }

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const { payload, raw } = await readUploadResponse(response);

      if (!response.ok || !payload.url) {
        if (response.status === 413 || /request entity too large/i.test(raw)) {
          throw new Error(`图片过大，上传请求被服务器拒绝。系统会自动压缩，但单张图片仍需控制在 ${DISPLAY_UPLOAD_LIMIT} 内。`);
        }

        throw new Error(payload.error ?? (raw.trim() || "图片上传失败。"));
      }

      onChange(payload.url);
      setLastPersistedValue(payload.url);
      setMessage(
        payload.saved
          ? payload.message ?? "图片已上传并写入当前内容。部署完成后，前台会显示新图片。"
          : autoSaveAfterUpload
          ? prepared.transformed
            ? "图片已自动裁切并压缩为网站适用尺寸，系统正在自动保存当前内容。部署完成后，前台将显示新图片。"
            : "图片已上传，系统正在自动保存当前内容。部署完成后，前台将显示新图片。"
          : prepared.transformed
            ? "图片已自动裁切并压缩为网站适用尺寸。保存当前内容后，网站会在下一次部署完成后显示新图片。"
            : payload.message ?? "图片上传成功。",
      );

      if (!payload.saved && autoSaveAfterUpload) {
        onRequestAutoSave?.();
      }
    } catch (uploadError) {
      replaceLocalPreview(null);
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function persistMediaValue(nextValue: string) {
    if (!saveTarget || disabled) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/media-field", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetSection: saveTarget.section,
          targetSlug: saveTarget.slug,
          targetField: saveTarget.field,
          targetIndex: saveTarget.index,
          value: nextValue,
        }),
      });
      const payload = (await response.json()) as { saved?: boolean; message?: string; error?: string };

      if (!response.ok || !payload.saved) {
        throw new Error(payload.error ?? "图片字段保存失败。");
      }

      setLastPersistedValue(nextValue);
      setMessage(payload.message ?? "图片字段已更新。");
    } catch (persistError) {
      setError(persistError instanceof Error ? persistError.message : "图片字段保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function handlePathBlur() {
    if (disabled) {
      return;
    }

    if (!saveTarget) {
      return;
    }

    const normalized = value.trim();
    if (normalized === lastPersistedValue.trim()) {
      return;
    }

    onChange(normalized);
    await persistMediaValue(normalized);
  }

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
        <p className="text-xs leading-6 text-[var(--muted)]">
          系统会自动按当前页面所需比例裁切，并在尽量保持清晰度的情况下压缩到可上传尺寸。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="overflow-hidden bg-[var(--surface-strong)]" style={{ aspectRatio: previewAspectRatio }}>
          {localPreview || value ? (
            <Image
              src={localPreview ?? value}
              alt={label}
              width={outputSize.width}
              height={outputSize.height}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs tracking-[0.16em] text-[var(--accent)]">
              暂无图片
            </div>
          )}
        </div>

        <div className="space-y-4">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => void handlePathBlur()}
            placeholder="可粘贴现有图片地址，或下方上传本地图片"
            disabled={disabled || uploading || saving}
            className="min-h-11 w-full border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
          <div className="flex flex-wrap gap-3">
            <label
              htmlFor={inputId}
              className={`inline-flex min-h-11 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors ${
                disabled || uploading || saving
                  ? "cursor-not-allowed opacity-55"
                  : "cursor-pointer hover:bg-[var(--surface-strong)]"
              }`}
            >
              {disabled ? "请先保存当前藏品" : uploading ? "处理中..." : saving ? "同步中..." : "上传本地图片"}
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
              disabled={disabled || uploading || saving}
            />
            <button
              type="button"
              onClick={() => {
                if (disabled) {
                  return;
                }
                replaceLocalPreview(null);
                setMessage(null);
                setError(null);
                onChange("");
                if (saveTarget) {
                  void persistMediaValue("");
                }
              }}
              disabled={disabled || uploading || saving}
              className="inline-flex min-h-11 items-center border border-[var(--line)] px-4 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
            >
              清空图片
            </button>
          </div>
          {disabled && disabledHint ? <p className="text-sm leading-7 text-[var(--muted)]">{disabledHint}</p> : null}
          {message ? <p className="text-sm leading-7 text-[var(--muted)]">{message}</p> : null}
          {error ? <p className="text-sm leading-7 text-[#8e4e3b]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
