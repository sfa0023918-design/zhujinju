"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./site-footer.module.css";

// Lines the wide-screen footer up with the masthead and content of each page:
// the home page keeps its own approved rail, inner pages use the shared content rail.
export function SiteFooterRail({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={`${styles.inner} ${pathname === "/" ? styles.homeInner : ""}`}>
      {children}
    </div>
  );
}
