"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./site-header.module.css";

export function SiteHeaderFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <header
      className={`${styles.header} ${pathname === "/" ? styles.homeHeader : ""} ${pathname === "/exhibitions/himalayan-art-2026" ? styles.seasonHeader : ""}`}
    >
      <div className={styles.inner}>{children}</div>
    </header>
  );
}
