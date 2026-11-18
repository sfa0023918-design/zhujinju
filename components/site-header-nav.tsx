"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentPropsWithoutRef } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";
import { PublicDocumentLink } from "./public-document-link";
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
};

function NavigationLink({ href, children, ...props }: ComponentPropsWithoutRef<"a"> & { href: string }) {
  return href === "/exhibitions"
    ? <PublicDocumentLink href={href} {...props}>{children}</PublicDocumentLink>
    : <Link href={href} prefetch={false} {...props}>{children}</Link>;
}

function MenuLinkStatus({ opening }: { opening: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <span className={styles.linkStatus} role="status">
      {pending || opening ? "正在打开…" : ""}
    </span>
  );
}

export function SiteHeaderNav({ items }: SiteHeaderNavProps) {
  const pathname = usePathname();
  const { open, setOpenPath } = useSiteMenu();
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setOpening(false);
        setOpenPath(null);
      }
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, [setOpenPath]);

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
          setOpening(false);
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
            <NavigationLink
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
            </NavigationLink>
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
                  <NavigationLink
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onPointerEnter={(event) => {
                      if (!active && item.href !== "/exhibitions" && event.pointerType === "mouse") router.prefetch(item.href);
                    }}
                    onFocus={(event) => {
                      if (!active && item.href !== "/exhibitions" && event.currentTarget.matches(":focus-visible")) router.prefetch(item.href);
                    }}
                    onClick={(event) => {
                      if (!active && item.href === "/exhibitions" && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setOpening(true);
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
                    <MenuLinkStatus opening={opening && item.href === "/exhibitions"} />
                  </NavigationLink>
                );
              })}
            </div>
          </div>
        </ModalDialog>
      ) : null}
    </>
  );
}
