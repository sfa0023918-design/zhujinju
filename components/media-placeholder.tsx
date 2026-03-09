type MediaPlaceholderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
};

export function MediaPlaceholder({
  eyebrow,
  title,
  subtitle = "Image forthcoming",
  compact = false,
  className = "",
}: MediaPlaceholderProps) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,rgba(239,235,229,0.82)_0%,rgba(233,228,221,0.98)_100%)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.36),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.16),transparent_62%)]" />
      <div className={`${compact ? "absolute inset-3" : "absolute inset-6 md:inset-8"} border border-[var(--line)]/28`} />
      <div className={`relative z-10 flex h-full flex-col justify-between ${compact ? "p-3.5" : "p-6 md:p-8"}`}>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]/54">{eyebrow}</p>
        <div className="border-t border-[var(--line)]/42 pt-2.5 text-[var(--muted)]">
          <p className={`${compact ? "text-[0.64rem]" : "text-[0.82rem]"} tracking-[0.06em] text-[var(--muted)]/88`}>
            图像整理中
          </p>
          <p className="mt-0.5 text-[0.42rem] uppercase tracking-[0.18em] text-[var(--accent)]/34">
            {subtitle}
          </p>
          {!compact ? <p className="mt-2 text-[0.84rem] leading-7 text-[var(--muted)]">{title}</p> : null}
        </div>
      </div>
    </div>
  );
}
