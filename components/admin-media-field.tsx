"use client";

import Image from "next/image";
import { useId, useState } from "react";

type AdminMediaFieldProps = {
  label: string;
  note?: string;
  folder: string;
  value: string;
  onChange: (value: string) => void;
};

export function AdminMediaField({
  label,
  note,
  folder,
  value,
  onChange,
}: AdminMediaFieldProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);
    setLocalPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; message?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "图片上传失败。");
      }

      onChange(payload.url);
      setMessage(payload.message ?? "图片上传成功。");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="space-y-1">
        <label htmlFor={inputId} className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">
          {label}
        </label>
        {note ? <p className="text-xs leading-6 text-[var(--muted)]">{note}</p> : null}
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
              className="aspect-[4/5] h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center text-xs tracking-[0.16em] text-[var(--accent)]">
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
              className="inline-flex min-h-11 cursor-pointer items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
            >
              {uploading ? "上传中" : "上传本地图片"}
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
