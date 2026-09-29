"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./site-header.module.css";

export function SiteHeaderFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={`${styles.inner} ${pathname === "/" ? styles.homeInner : ""}`}>
        {children}
      </div>
    </header>
  );
}
