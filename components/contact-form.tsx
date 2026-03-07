"use client";

import { useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { ActionLabel } from "./action-label";
import { BilingualText } from "./bilingual-text";

type ContactFormProps = {
  initialArtwork?: string;
  copy: {
    introIdle: BilingualValue;
    introSubmitting: BilingualValue;
    introSuccess: BilingualValue;
    introError: BilingualValue;
    nameLabel: BilingualValue;
    emailLabel: BilingualValue;
    organizationLabel: BilingualValue;
    roleLabel: BilingualValue;
    artworkLabel: BilingualValue;
    messageLabel: BilingualValue;
    submitLabel: BilingualValue;
    submittingLabel: BilingualValue;
    roleOptions: BilingualValue[];
  };
};

export function ContactForm({ initialArtwork, copy }: ContactFormProps) {
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
    idle: copy.introIdle,
    submitting: copy.introSubmitting,
    success: copy.introSuccess,
    error: copy.introError,
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
            text={copy.nameLabel}
            mode="inline"
            className="block"
            zhClassName="text-sm"
            enClassName="text-[0.56rem] uppercase tracking-[0.16em] text-[var(--accent)]"
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
            text={copy.emailLabel}
            mode="inline"
            className="block"
            zhClassName="text-sm"
            enClassName="text-[0.56rem] uppercase tracking-[0.16em] text-[var(--accent)]"
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
            text={copy.organizationLabel}
            mode="inline"
            className="block"
            zhClassName="text-sm"
            enClassName="text-[0.56rem] uppercase tracking-[0.16em] text-[var(--accent)]"
          />
          <input
            name="organization"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={copy.roleLabel}
            mode="inline"
            className="block"
            zhClassName="text-sm"
            enClassName="text-[0.56rem] uppercase tracking-[0.16em] text-[var(--accent)]"
          />
          <select
            name="identity"
            defaultValue={`${copy.roleOptions[0]?.zh ?? ""} · ${copy.roleOptions[0]?.en ?? ""}`}
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          >
            {copy.roleOptions.map((option) => (
              <option key={option.zh}>{`${option.zh} · ${option.en}`}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={copy.artworkLabel}
            mode="inline"
            className="block"
            zhClassName="text-sm"
            enClassName="text-[0.56rem] uppercase tracking-[0.16em] text-[var(--accent)]"
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
            text={copy.messageLabel}
            mode="inline"
            className="block"
            zhClassName="text-sm"
            enClassName="text-[0.56rem] uppercase tracking-[0.16em] text-[var(--accent)]"
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
          className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-6 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? (
            <ActionLabel text={copy.submittingLabel} />
          ) : (
            <ActionLabel text={copy.submitLabel} />
          )}
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
