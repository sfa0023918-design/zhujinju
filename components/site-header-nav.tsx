"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";
import { warmImage } from "@/lib/warm-image";
import { COVER_VAJRA_IMAGE, EXHIBITION_COVER_SIZES } from "@/lib/artwork-presentation";
import { BilingualText } from "./bilingual-text";
import { useSiteMenu } from "./site-menu-state";
import { ModalDialog } from "./modal-dialog";
import styles from "./site-header-nav.module.css";

type NavItem = {
  href: string;
  label: BilingualValue;
};

type SiteHeaderNavProps = {
  items: NavItem[];
  hasSeasonalCover: boolean;
};

function MenuLinkStatus() {
  const { pending } = useLinkStatus();
  return (
    <span className={styles.linkStatus} role="status">
      {pending ? "正在打开…" : ""}
    </span>
  );
}

export function SiteHeaderNav({ items, hasSeasonalCover }: SiteHeaderNavProps) {
  const pathname = usePathname();
  const { open, setOpenPath } = useSiteMenu();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!open) {
      return;
    }

    const desktop = window.matchMedia("(min-width: 1181px) and (pointer: fine)");
    const closeOnDesktop = () => { if (desktop.matches) setOpenPath(null); };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open, setOpenPath]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "关闭菜单 Close menu" : "打开菜单 Open menu"}
        aria-expanded={open}
        aria-controls="site-mobile-nav"
        onClick={() => {
          if (!open && pathname !== "/exhibitions") router.prefetch("/exhibitions");
          setOpenPath(open ? null : pathname);
        }}
        className={styles.menuButton}
      >
        <span className={styles.menuLabel}>
          <span>菜单</span>
          <span lang="en" className={styles.menuEnglish}>Menu</span>
        </span>
      </button>

      <nav aria-label="主导航" className={styles.desktopNav}>
        {items.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
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
        <ModalDialog id="site-mobile-nav" label="主导航 Main navigation"
          className={styles.mobileBackdrop} onDismiss={() => setOpenPath(null)}>
          <button type="button" className={styles.menuClose} aria-label="关闭菜单 Close menu"
            onClick={() => setOpenPath(null)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <div
            className={styles.mobilePanel}
          >
            <div className={styles.mobileLinks}>
              {items.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    prefetch={item.href === "/collection" || item.href === "/journal" ? null : false}
                    onPointerEnter={(event) => {
                      if (!active && event.pointerType === "mouse") router.prefetch(item.href);
                    }}
                    onFocus={(event) => {
                      if (!active && event.currentTarget.matches(":focus-visible")) router.prefetch(item.href);
                    }}
                    onNavigate={() => {
                      if (!active && hasSeasonalCover && item.href === "/exhibitions") {
                        warmImage(COVER_VAJRA_IMAGE, 900, 1198, EXHIBITION_COVER_SIZES, 86);
                      }
                    }}
                    onClick={() => {
                      // Other destinations close when pathname changes; keep
                      // their Link mounted until the navigation commits.
                      if (item.href === pathname) setOpenPath(null);
                    }}
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
                    <MenuLinkStatus />
                  </Link>
                );
              })}
            </div>
          </div>
        </ModalDialog>
      ) : null}
    </>
  );
}
