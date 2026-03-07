"use client";

import { useState } from "react";

type ContactFormProps = {
  initialArtwork?: string;
};

export function ContactForm({ initialArtwork }: ContactFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");

    const payload = {
      name: formData.get("name"),
      organization: formData.get("organization"),
      email: formData.get("email"),
      identity: formData.get("identity"),
      artwork: formData.get("artwork"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-5 border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <span>姓名</span>
          <input
            required
            name="name"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <span>邮箱</span>
          <input
            required
            type="email"
            name="email"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <span>机构 / 公司</span>
          <input
            name="organization"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <span>身份</span>
          <select
            name="identity"
            defaultValue="藏家"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          >
            <option>藏家</option>
            <option>机构</option>
            <option>策展人</option>
            <option>研究者</option>
            <option>媒体</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <span>意向作品</span>
        <input
          name="artwork"
          defaultValue={initialArtwork}
          className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
        />
      </label>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <span>留言</span>
        <textarea
          required
          name="message"
          rows={6}
          className="border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
        />
      </label>
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-6 text-sm text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "提交中" : "发送联系信息"}
        </button>
        <p className="text-sm text-[var(--muted)]">
          {status === "success"
            ? "已收到信息。当前为本地演示接口，后续可接入邮箱或 CRM。"
            : status === "error"
              ? "提交失败，请稍后再试。"
              : "欢迎藏家、机构、策展人与研究者联系。"}
        </p>
      </div>
    </form>
  );
}
