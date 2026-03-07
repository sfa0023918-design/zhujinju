"use client";

import { useState } from "react";

import { BilingualText } from "./bilingual-text";

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

  const statusCopy = {
    idle: {
      zh: "欢迎藏家、机构、策展人与研究者联系。",
      en: "Collectors, institutions, curators, and researchers are welcome to get in touch.",
    },
    submitting: {
      zh: "提交中",
      en: "Sending",
    },
    success: {
      zh: "已收到信息。当前为本地演示接口，后续可接入邮箱或 CRM。",
      en: "Message received. This is currently a local demo endpoint and can later be connected to email or a CRM.",
    },
    error: {
      zh: "提交失败，请稍后再试。",
      en: "Submission failed. Please try again later.",
    },
  } as const;

  return (
    <form
      action={handleSubmit}
      className="space-y-5 border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={{ zh: "姓名", en: "Name" }}
            className="flex flex-col gap-1"
            zhClassName="text-sm"
            enClassName="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--accent)]"
          />
          <input
            required
            name="name"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={{ zh: "邮箱", en: "Email" }}
            className="flex flex-col gap-1"
            zhClassName="text-sm"
            enClassName="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--accent)]"
          />
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
          <BilingualText
            as="span"
            text={{ zh: "机构 / 公司", en: "Institution / Company" }}
            className="flex flex-col gap-1"
            zhClassName="text-sm"
            enClassName="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--accent)]"
          />
          <input
            name="organization"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={{ zh: "身份", en: "Role" }}
            className="flex flex-col gap-1"
            zhClassName="text-sm"
            enClassName="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--accent)]"
          />
          <select
            name="identity"
            defaultValue="藏家 / Collector"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          >
            <option>藏家 / Collector</option>
            <option>机构 / Institution</option>
            <option>策展人 / Curator</option>
            <option>研究者 / Researcher</option>
            <option>媒体 / Press</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <BilingualText
          as="span"
          text={{ zh: "意向作品", en: "Artwork of Interest" }}
          className="flex flex-col gap-1"
          zhClassName="text-sm"
          enClassName="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--accent)]"
        />
        <input
          name="artwork"
          defaultValue={initialArtwork}
          className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
        />
      </label>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
        <BilingualText
          as="span"
          text={{ zh: "留言", en: "Message" }}
          className="flex flex-col gap-1"
          zhClassName="text-sm"
          enClassName="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--accent)]"
        />
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
          {status === "submitting" ? "提交中 / Sending" : "发送联系信息 / Send Inquiry"}
        </button>
        <BilingualText
          as="p"
          text={statusCopy[status]}
          className="flex flex-col gap-2 text-sm text-[var(--muted)]"
          zhClassName="leading-7"
          enClassName="text-[0.74rem] leading-6 text-[var(--accent)]/80"
        />
      </div>
    </form>
  );
}
