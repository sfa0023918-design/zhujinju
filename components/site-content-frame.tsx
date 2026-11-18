"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { preload } from "react-dom";
import pageFonts from "@/lib/data/page-reading-fonts.json";
import titleFonts from "@/lib/data/page-title-fonts.json";
import styles from "@/app/(site)/site-layout.module.css";

export function SiteContentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const font = (pageFonts as Record<string, string>)[pathname];
  const titleFont = (titleFonts as Record<string, string>)[pathname];
  const family = font ? `Reading-${font.replace(/\.woff2$/, "")}` : undefined;
  const titleFamily = titleFont ? `Title-${titleFont.replace(/\.woff2$/, "")}` : undefined;
  const readingFamily = [titleFamily, family]
    .filter(Boolean)
    .map((name) => `"${name}"`)
    .concat('"Zhujinju Song", "Songti SC", serif')
    .join(", ");
  for (const file of [titleFont, font]) {
    // On the home page the first photograph and styles take precedence. The
    // browser discovers the same local face from the visible title below.
    if (file && pathname !== "/") preload(`/fonts/${file}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return (
    <main
      style={{
        "--font-song": readingFamily,
        "--font-serif": readingFamily,
      } as CSSProperties}
      className={
        pathname === "/journal/form-and-devotion-2026"
          ? styles.legacyEditorial
          : undefined
      }
    >
      {/* Register before streamed text appears and retain faces across navigation. */}
      {family && font ? <style key={font} href={`reading-${font}`} precedence="page-fonts">{`@font-face { font-family: "${family}"; font-style: normal; font-weight: 400; font-display: swap; src: url("/fonts/${font}") format("woff2"); }`}</style> : null}
      {titleFamily && titleFont ? <style key={titleFont} href={`title-${titleFont}`} precedence="page-fonts">{`@font-face { font-family: "${titleFamily}"; font-style: normal; font-weight: 400; font-display: swap; src: url("/fonts/${titleFont}") format("woff2"); }`}</style> : null}
      {children}
    </main>
  );
}
