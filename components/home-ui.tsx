import Link from "next/link";
import type { BilingualText } from "@/lib/site-data";
import styles from "@/app/(site)/home.module.css";

export function HomeArrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M1.5 8h12.5M9.5 3.5 14 8l-4.5 4.5" />
    </svg>
  );
}

export function HomeLabel({
  text,
  stacked = false,
  muted = false,
}: {
  text: BilingualText;
  stacked?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={stacked ? styles.labelStack : styles.labelPair}>
      <span className={styles.labelZh}>{text.zh}</span>
      <span
        className={`${styles.labelEn} ${muted ? styles.muted : ""}`}
        lang="en"
      >
        {text.en}
      </span>
    </div>
  );
}

export function HomeAction({
  href,
  text,
  subtle = false,
  arrow = true,
  className = "",
}: {
  href: string;
  text: BilingualText;
  subtle?: boolean;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${subtle ? styles.textLink : styles.button} ${className}`}
    >
      <span>
        {text.zh}
        <small lang="en">{text.en}</small>
      </span>
      {arrow ? <HomeArrow /> : null}
    </Link>
  );
}
