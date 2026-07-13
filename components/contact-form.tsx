"use client";

import { type FormEvent, useRef, useState } from "react";

import { BilingualText } from "@/components/bilingual-text";
import type { BilingualText as BilingualValue } from "@/lib/site-data";

import styles from "./institutional-pages.module.css";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
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

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={styles.inquiryForm}
      aria-busy={status === "submitting"}
    >
      <input type="hidden" name="submittedAt" value={submittedAt} />
      <label className={styles.honeypot} aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" name="website" />
      </label>

      <BilingualText
        as="p"
        text={statusCopy[status]}
        className={styles.formIntroduction}
        data-status={status}
        aria-live="polite"
        aria-atomic="true"
        zhClassName={styles.zh}
        enClassName={styles.en}
      />

      <div className={styles.formGrid}>
        <ContactField label={copy.nameLabel}>
          <input required name="name" />
        </ContactField>
        <ContactField label={copy.emailLabel}>
          <input required type="email" name="email" />
        </ContactField>
        <ContactField label={copy.organizationLabel}>
          <input name="organization" />
        </ContactField>
        <ContactField label={copy.roleLabel}>
          <select
            name="identity"
            defaultValue={`${copy.roleOptions[0]?.zh ?? ""} · ${copy.roleOptions[0]?.en ?? ""}`}
          >
            {copy.roleOptions.map((option) => (
              <option key={option.zh}>{`${option.zh} · ${option.en}`}</option>
            ))}
          </select>
        </ContactField>
        <ContactField label={copy.artworkLabel} className={styles.fullField}>
          <input name="artwork" defaultValue={initialArtwork} />
        </ContactField>
        <ContactField label={copy.messageLabel} className={styles.fullField}>
          <textarea required name="message" rows={6} />
        </ContactField>
      </div>

      <div className={styles.formFooter}>
        <button type="submit" disabled={status === "submitting"}>
          <BilingualText
            as="span"
            text={status === "submitting" ? copy.submittingLabel : copy.submitLabel}
            className={styles.submitLabel}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </button>
        {status === "error" && errorMessage ? (
          <p className={styles.formError} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function ContactField({
  label,
  children,
  className,
}: {
  label: BilingualValue;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`${styles.formField} ${className ?? ""}`}>
      <BilingualText
        as="span"
        text={label}
        mode="inline"
        className={styles.formLabel}
        zhClassName={styles.inlineZh}
        enClassName={styles.inlineEn}
      />
      {children}
    </label>
  );
}
