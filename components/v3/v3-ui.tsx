"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import type { ArtworkStatus, BilingualText } from "@/lib/data/types";

export function Bi({
  text,
  fallback = "",
}: {
  text?: BilingualText | string | null;
  fallback?: string;
}) {
  if (!text) return <>{fallback}</>;
  if (typeof text === "string") return <>{text}</>;
  const zh = text.zh || text.en || fallback;
  const en = text.en || text.zh || fallback;
  if (zh === en) return <>{zh}</>;
  return (
    <>
      <span className="t-zh">{zh}</span>
      <span className="t-en" lang="en">
        {en}
      </span>
    </>
  );
}

export function StatusPill({ status }: { status: ArtworkStatus }) {
  if (status === "sold") {
    return (
      <span className="status-pill is-sold">
        <i className="status-dot" aria-hidden="true" />
        <span className="t-zh">已洽购</span>
        <span className="t-en" lang="en">
          Acquired
        </span>
      </span>
    );
  }
  if (status === "reserved") {
    return (
      <span className="status-pill is-reserved">
        <i className="status-dot" aria-hidden="true" />
        <span className="t-zh">已预留</span>
        <span className="t-en" lang="en">
          On hold
        </span>
      </span>
    );
  }
  return (
    <span className="status-pill is-available">
      <i className="status-dot" aria-hidden="true" />
      <span className="t-zh">可洽询</span>
      <span className="t-en" lang="en">
        Available
      </span>
    </span>
  );
}

export function Eyebrow({
  en,
  zh,
}: {
  en: string;
  zh?: string;
}) {
  return (
    <>
      {en}
      {zh ? <span className="t-zh"> · {zh}</span> : null}
    </>
  );
}

export function SectionHead({
  eyebrow,
  eyebrowZh,
  zh,
  en,
  right,
}: {
  eyebrow: string;
  eyebrowZh?: string;
  zh: string;
  en: string;
  right?: ReactNode;
}) {
  const parts = !eyebrowZh && eyebrow.includes(" · ") ? eyebrow.split(" · ") : null;
  const enPart = parts ? parts[0] : eyebrow;
  const zhPart = eyebrowZh ?? (parts && /[\u4e00-\u9fff]/.test(parts[1] || "") ? parts.slice(1).join(" · ") : undefined);

  return (
    <div className="v3-sec-head">
      <div>
        <p className="micro-label v3-eyebrow">
          <Eyebrow en={enPart} zh={zhPart} />
        </p>
        <h2 className="v3-h2">
          <span className="t-zh">{zh}</span>
          <span className="t-en" lang="en">
            {en}
          </span>
        </h2>
      </div>
      {right ?? null}
      <span className="v3-rule" data-draw="" aria-hidden="true" />
    </div>
  );
}

export function ArrowLink({
  href,
  zh,
  en,
  light = false,
  arrow = "→",
}: {
  href: string;
  zh: string;
  en: string;
  light?: boolean;
  arrow?: string;
}) {
  return (
    <Link className={`v3-link${light ? " v3-link-light" : ""}`} href={href}>
      <span className="t-zh">{zh}</span>
      <span className="t-en" lang="en">
        {en}
      </span>
      <i aria-hidden="true">{arrow}</i>
    </Link>
  );
}

export function V3Button({
  href,
  zh,
  en,
  variant = "dark",
  onClick,
  block = false,
}: {
  href?: string;
  zh: string;
  en: string;
  variant?: "dark" | "light" | "outline";
  onClick?: () => void;
  block?: boolean;
}) {
  const cls = `v3-btn v3-btn-${variant}${block ? " v3-btn-block" : ""}`;
  const inner = (
    <span className="v3-btn-text">
      <span className="roll-slot">
        <span className="roll-a">
          <span className="t-zh">{zh}</span>
          <span className="t-en" lang="en">
            {en}
          </span>
        </span>
        <span className="roll-b" aria-hidden="true">
          <span className="t-zh">{zh}</span>
          <span className="t-en">{en}</span>
        </span>
      </span>
      <i aria-hidden="true">→</i>
    </span>
  );
  if (href) {
    return (
      <Link className={cls} href={href} data-magnetic="0.12">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} data-magnetic="0.12">
      {inner}
    </button>
  );
}

/**
 * Attaches smooth mouse drag-to-scroll with inertia on horizontal gallery rails.
 */
export function attachDragScroll(el: HTMLElement | null): () => void {
  if (!el) return () => {};
  let down = false;
  let sx = 0;
  let sl = 0;
  let moved = 0;
  let v = 0;
  let lx = 0;
  let raf = 0;

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    down = true;
    moved = 0;
    sx = lx = e.clientX;
    sl = el.scrollLeft;
    cancelAnimationFrame(raf);
    el.classList.add("is-drag");
  };
  const onMove = (e: PointerEvent) => {
    if (!down) return;
    const dx = e.clientX - sx;
    moved = Math.max(moved, Math.abs(dx));
    v = e.clientX - lx;
    lx = e.clientX;
    el.scrollLeft = sl - dx;
  };
  const onUp = () => {
    if (!down) return;
    down = false;
    el.classList.remove("is-drag");
    const glide = () => {
      v *= 0.94;
      el.scrollLeft -= v;
      if (Math.abs(v) > 0.4) raf = requestAnimationFrame(glide);
    };
    raf = requestAnimationFrame(glide);
  };
  const onClickCapture = (e: MouseEvent) => {
    if (moved > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  el.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  el.addEventListener("click", onClickCapture, true);

  return () => {
    cancelAnimationFrame(raf);
    el.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    el.removeEventListener("click", onClickCapture, true);
  };
}

/**
 * Observes [data-reveal], [data-draw], [data-stagger], and [data-count] elements inside the page.
 * Renders exact archival numbers immediately (no mid-count distortion) and guarantees no element
 * remains stuck hidden after scrolling, filtering, or switching languages.
 */
export function useV3Reveal(depKey: string) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setFinalCount = (el: HTMLElement) => {
      const to = parseFloat(el.dataset.count || "0");
      const padN = Number(el.dataset.pad || 0);
      el.textContent = padN ? String(to).padStart(padN, "0") : String(to);
    };

    const staggers = document.querySelectorAll<HTMLElement>("[data-stagger]");
    staggers.forEach((wrap) => {
      Array.from(wrap.children).forEach((child, idx) => {
        (child as HTMLElement).style.setProperty("--d", `${Math.min(idx, 8) * 35}ms`);
      });
    });

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal],[data-count],[data-draw],[data-stagger]"),
    );

    targets.forEach((el) => {
      if (el.hasAttribute("data-count")) setFinalCount(el);
    });

    if (reduce || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const revealVisibleOrPassed = () => {
      const cutoff = window.innerHeight + 140;
      targets.forEach((el) => {
        if (el.classList.contains("is-in")) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= cutoff) {
          el.classList.add("is-in");
        }
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          el.classList.add("is-in");
          io.unobserve(el);
        });
      },
      { threshold: 0.01, rootMargin: "140px 0px 140px 0px" },
    );

    targets.forEach((el) => {
      if (!el.classList.contains("is-in")) io.observe(el);
    });
    revealVisibleOrPassed();

    const raf = requestAnimationFrame(revealVisibleOrPassed);
    window.addEventListener("scroll", revealVisibleOrPassed, { passive: true });
    window.addEventListener("resize", revealVisibleOrPassed, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", revealVisibleOrPassed);
      window.removeEventListener("resize", revealVisibleOrPassed);
      io.disconnect();
    };
  }, [depKey]);
}
