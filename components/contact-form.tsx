"use client";

import { useRef, useState } from "react";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedAt, setSubmittedAt] = useState(() => Date.now().toString());

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setErrorMessage("");

    const payload = {
      name: formData.get("name"),
      organization: formData.get("organization"),
      email: formData.get("email"),
      identity: formData.get("identity"),
      artwork: formData.get("artwork"),
      message: formData.get("message"),
      website: formData.get("website"),
      submittedAt: formData.get("submittedAt"),
    };

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error || "Request failed");
      }

      formRef.current?.reset();
      const artworkField = formRef.current?.elements.namedItem("artwork");

      if (artworkField instanceof HTMLInputElement && initialArtwork) {
        artworkField.value = initialArtwork;
      }

      setSubmittedAt(Date.now().toString());
      setStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交失败，请稍后再试。");
      setSubmittedAt(Date.now().toString());
      setStatus("error");
    }
  }

  const statusCopy = {
    idle: copy.introIdle,
    submitting: copy.introSubmitting,
    success: copy.introSuccess,
    error: copy.introError,
  } as const;
  const statusTone =
    status === "success"
      ? "text-[var(--ink)]"
      : status === "error"
        ? "text-[var(--accent)]"
        : "text-[var(--muted)]";

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-4 border border-[var(--line)]/75 bg-[var(--surface)] px-5 py-5 md:px-7 md:py-6"
    >
      <input type="hidden" name="submittedAt" value={submittedAt} />
      <label className="hidden" aria-hidden="true">
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          name="website"
          className="hidden"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={copy.nameLabel}
            mode="inline"
            className="block"
            zhClassName="text-[15px]"
            enClassName="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]/62"
          />
          <input
            required
            name="name"
            className="h-10 border border-[var(--line)]/75 bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={copy.emailLabel}
            mode="inline"
            className="block"
            zhClassName="text-[15px]"
            enClassName="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]/62"
          />
          <input
            required
            type="email"
            name="email"
            className="h-10 border border-[var(--line)]/75 bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={copy.organizationLabel}
            mode="inline"
            className="block"
            zhClassName="text-[15px]"
            enClassName="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]/62"
          />
          <input
            name="organization"
            className="h-10 border border-[var(--line)]/75 bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={copy.roleLabel}
            mode="inline"
            className="block"
            zhClassName="text-[15px]"
            enClassName="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]/62"
          />
          <select
            name="identity"
            defaultValue={`${copy.roleOptions[0]?.zh ?? ""} · ${copy.roleOptions[0]?.en ?? ""}`}
            className="h-10 border border-[var(--line)]/75 bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
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
            zhClassName="text-[15px]"
            enClassName="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]/62"
          />
        <input
          name="artwork"
          defaultValue={initialArtwork}
          className="h-10 border border-[var(--line)]/75 bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
        />
      </label>
      <label className="grid gap-2 text-sm text-[var(--muted)]">
          <BilingualText
            as="span"
            text={copy.messageLabel}
            mode="inline"
            className="block"
            zhClassName="text-[15px]"
            enClassName="text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]/62"
          />
        <textarea
          required
          name="message"
          rows={5}
          className="border border-[var(--line)]/75 bg-[var(--bg)] px-3 py-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
        />
      </label>
      <div className="flex flex-col items-start gap-3 border-t border-[var(--line)]/65 pt-4 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex min-h-10 items-center border border-[var(--line-strong)]/85 px-5 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
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
          className={`flex max-w-[25rem] flex-col gap-1.5 text-sm ${statusTone}`}
          zhClassName="text-[15px] leading-7"
          enClassName="text-[11px] leading-5 text-[var(--accent)]/72"
        />
      </div>
      {status === "error" && errorMessage ? (
        <p className="text-sm leading-6 text-[var(--accent)]">{errorMessage}</p>
      ) : null}
    </form>
  );
}
