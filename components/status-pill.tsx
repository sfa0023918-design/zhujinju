import { getArtworkStatusText } from "@/lib/bilingual";
import type { ArtworkStatus } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

type StatusPillProps = {
  status: ArtworkStatus;
  variant?: "default" | "fine";
};

const statusClassMap: Record<ArtworkStatus, string> = {
  inquiry: "border-[var(--line-strong)] text-[var(--ink)]",
  sold: "border-[var(--line)] text-[var(--muted)]",
  reserved: "border-[var(--line)] text-[var(--muted)]",
};

export function StatusPill({ status, variant = "default" }: StatusPillProps) {
  const baseClassName =
    variant === "fine"
      ? "inline-flex items-center rounded-full border px-[0.34rem] py-[0.06rem]"
      : "inline-flex items-center rounded-full border px-2.5 py-[0.22rem]";
  const zhClassName = variant === "fine" ? "text-[0.48rem] tracking-[0.14em]" : "text-[0.64rem] tracking-[0.16em]";
  const enClassName =
    variant === "fine"
      ? "text-[0.28rem] uppercase tracking-[0.1em] opacity-82"
      : "text-[0.4rem] uppercase tracking-[0.1em] opacity-82";

  return (
    <BilingualText
      as="span"
      text={getArtworkStatusText(status)}
      mode="inline"
      className={`${baseClassName} ${statusClassMap[status]}`}
      zhClassName={zhClassName}
      enClassName={enClassName}
    />
  );
}
