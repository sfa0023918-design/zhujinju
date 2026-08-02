"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";
import { BilingualText } from "./bilingual-text";
import styles from "./site-header-nav.module.css";

type NavItem = {
  href: string;
  label: BilingualValue;
};

type SiteHeaderNavProps = {
  items: NavItem[];
};

export function SiteHeaderNav({ items }: SiteHeaderNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="site-mobile-nav"
        onClick={() => setOpen((value) => !value)}
        className={styles.menuButton}
      >
        <span>{open ? "关闭" : "导航"}</span>
      </button>

      <nav
        aria-label="主导航"
        className={styles.desktopNav}
      >
        {items.map((item) => {
          const active = isActive(item.href);
          const sectionStart = item.href === "/about";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""} ${
                sectionStart ? styles.navLinkSectionStart : ""
              }`}
            >
              <BilingualText
                as="span"
                text={item.label}
                mode="stacked"
                className={styles.navLabel}
                zhClassName={styles.navZh}
                enClassName={styles.navEn}
              />
            </Link>
          );
        })}
      </nav>

      {open ? (
        <div className={styles.mobileBackdrop} onClick={() => setOpen(false)}>
          <div
            id="site-mobile-nav"
            className={styles.mobilePanel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.mobileLinks}>
              {items.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`${styles.mobileLink} ${active ? styles.mobileLinkActive : ""}`}
                  >
                    <BilingualText
                      as="span"
                      text={item.label}
                      mode="stacked"
                      className={styles.mobileLabel}
                      zhClassName={styles.mobileZh}
                      enClassName={styles.mobileEn}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
