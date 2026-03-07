import { getArtworkStatusText } from "@/lib/bilingual";
import type { ArtworkStatus } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

type StatusPillProps = {
  status: ArtworkStatus;
};

const statusClassMap: Record<ArtworkStatus, string> = {
  inquiry: "border-[var(--line-strong)] text-[var(--ink)]",
  sold: "border-[var(--line)] text-[var(--muted)]",
  reserved: "border-[var(--line)] text-[var(--muted)]",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <BilingualText
      as="span"
      text={getArtworkStatusText(status)}
      mode="inline"
      className={`inline-flex items-center rounded-full border px-3 py-1 ${statusClassMap[status]}`}
      zhClassName="text-[0.72rem] tracking-[0.18em]"
      enClassName="text-[0.46rem] uppercase tracking-[0.14em] opacity-75"
    />
  );
}
