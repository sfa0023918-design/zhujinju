"use client";

import { type FormEvent, useRef, useState } from "react";

import type { InquiryWork } from "@/lib/artwork-inquiry";
import { ProtectedImage } from "@/components/protected-image";
import { BilingualText } from "@/components/bilingual-text";
import type { BilingualText as BilingualValue } from "@/lib/site-data";

import styles from "./institutional-pages.module.css";

type ContactFormProps = {
  initialArtwork?: string;
  work?: InquiryWork;
  request?: BilingualValue;
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

export function ContactForm({ initialArtwork, work, request, copy }: ContactFormProps) {
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
      work: work?.slug,
      request: request?.zh || request?.en,
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
      id="inquiry"
      aria-label="咨询表单 / Inquiry form"
      tabIndex={-1}
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

      {work ? (
        <div className={styles.selectedWork}>
          {work.image ? <ProtectedImage src={work.image} alt="" width={72} height={88} sizes="72px" /> : null}
          <div>
            <p>{work.title.zh} <span lang="en">{work.title.en}</span></p>
            <p>{work.details.zh} <span lang="en">{work.details.en}</span></p>
          </div>
        </div>
      ) : null}
      {request ? (
        <p className={styles.selectedRequest}>
          所选资料 · {request.zh.replace(/^可索取/, "") || request.en}
          <span lang="en">Requested material{request.en ? ` · ${request.en.replace(/ available on request$/i, "")}` : ""}</span>
        </p>
      ) : null}
      <p className={styles.requiredNote}>* 必填 <span lang="en">Required fields</span></p>
      <div className={styles.formGrid}>
        <ContactField label={copy.nameLabel} required>
          <input required name="name" />
        </ContactField>
        <ContactField label={copy.emailLabel} required>
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
        {!work ? (
          <ContactField label={copy.artworkLabel} className={styles.fullField}>
            <input name="artwork" maxLength={200} defaultValue={initialArtwork} />
          </ContactField>
        ) : null}
        <ContactField label={copy.messageLabel} className={styles.fullField} required={!(work && request)}>
          <textarea required={!(work && request)} name="message" rows={6} />
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
  required = false,
}: {
  label: BilingualValue;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`${styles.formField} ${className ?? ""}`}>
      <BilingualText
        as="span"
        text={required ? { zh: `${label.zh} *`, en: label.en } : label}
        mode="inline"
        className={styles.formLabel}
        zhClassName={styles.inlineZh}
        enClassName={styles.inlineEn}
      />
      {children}
    </label>
  );
}
