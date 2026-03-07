import type { ArtworkStatus } from "@/lib/site-data";

type StatusPillProps = {
  status: ArtworkStatus;
};

const statusClassMap: Record<ArtworkStatus, string> = {
  可洽询: "border-[var(--line-strong)] text-[var(--ink)]",
  已售: "border-[var(--line)] text-[var(--muted)]",
  暂留: "border-[var(--line)] text-[var(--muted)]",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] tracking-[0.18em] uppercase ${statusClassMap[status]}`}
    >
      {status}
    </span>
  );
}
