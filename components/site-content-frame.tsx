"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "@/app/(site)/site-layout.module.css";

export function SiteContentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main
      className={
        pathname === "/journal/form-and-devotion-2026"
          ? styles.legacyEditorial
          : undefined
      }
    >
      {children}
    </main>
  );
}
