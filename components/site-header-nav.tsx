"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { preload } from "react-dom";
import exhibitionCover from "@/lib/data/exhibition-cover-photo.json";
import { useNavigationPreview } from "./navigation-preview";
import { COVER_VAJRA_IMAGE, EXHIBITION_COVER_SIZES } from "@/lib/artwork-presentation";

import type { BilingualText as BilingualValue } from "@/lib/site-data";
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
  exhibition?: { title: BilingualValue; facts: BilingualValue };
};

function MenuLinkStatus() {
  const { pending } = useLinkStatus();
  return (
    <span className={styles.linkStatus} role="status">
      {pending ? "正在打开…" : ""}
    </span>
  );
}

export function SiteHeaderNav({ items, exhibition }: SiteHeaderNavProps) {
  const pathname = usePathname();
  const { open, setOpenPath } = useSiteMenu();
  const router = useRouter();

  const openPreview = useNavigationPreview();

  function navigateToExhibition(event: { preventDefault(): void }, href: string) {
    if (exhibition && href === "/exhibitions" && pathname !== href) {
      if (openPreview) {
        event.preventDefault();
        setOpenPath(null);
        openPreview(href, { ...exhibition, source: COVER_VAJRA_IMAGE, width: 900, height: 1198, sizes: EXHIBITION_COVER_SIZES, exhibition: true });
      }
      preload(exhibitionCover.href, {
        as: "image", type: exhibitionCover.type, imageSrcSet: exhibitionCover.srcSet,
        imageSizes: EXHIBITION_COVER_SIZES, fetchPriority: "high",
      });
    }
  }

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
        onClick={() => setOpenPath(open ? null : pathname)}
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
              prefetch={false}
              onPointerEnter={event => {
                if (!active && event.pointerType === "mouse") router.prefetch(item.href);
              }}
              onFocus={event => {
                if (!active && event.currentTarget.matches(":focus-visible")) router.prefetch(item.href);
              }}
              onNavigate={event => navigateToExhibition(event, item.href)}
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
                    prefetch={false}
                    onTouchStart={() => {
                      // Start the exhibition navigation at tap priority, outside the prefetch queue.
                      if (!active && item.href !== "/exhibitions") router.prefetch(item.href);
                    }}
                    onPointerEnter={(event) => {
                      if (!active && event.pointerType === "mouse") router.prefetch(item.href);
                    }}
                    onFocus={(event) => {
                      if (!active && event.currentTarget.matches(":focus-visible")) router.prefetch(item.href);
                    }}
                    onNavigate={event => navigateToExhibition(event, item.href)}
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
