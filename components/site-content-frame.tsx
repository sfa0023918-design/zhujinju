"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { preload } from "react-dom";
import pageFonts from "@/lib/data/page-reading-fonts.json";
import styles from "@/app/(site)/site-layout.module.css";

export function SiteContentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const font = (pageFonts as Record<string, string>)[pathname];
  const family = font ? `Reading-${font.replace(/\.woff2$/, "")}` : undefined;
  const readingFamily = family ? `"${family}", "Zhujinju Song", "Songti SC", serif` : undefined;
  if (font) {
    preload(`/fonts/${font}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return (
    <main
      style={readingFamily ? {
        "--font-song": readingFamily,
        "--font-serif": readingFamily,
      } as CSSProperties : undefined}
      className={
        pathname === "/journal/form-and-devotion-2026"
          ? styles.legacyEditorial
          : undefined
      }
    >
      {family && font ? <style>{`@font-face { font-family: "${family}"; font-style: normal; font-weight: 400; font-display: swap; src: url("/fonts/${font}") format("woff2"); }`}</style> : null}
      {children}
    </main>
  );
}
