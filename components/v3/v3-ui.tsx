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

export function SectionHead({
  eyebrow,
  zh,
  en,
  right,
}: {
  eyebrow: string;
  zh: string;
  en: string;
  right?: ReactNode;
}) {
  return (
    <div className="v3-sec-head">
      <div>
        <p className="micro-label v3-eyebrow">{eyebrow}</p>
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
 */
export function useV3Reveal(depKey: string) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const countUp = (el: HTMLElement) => {
      const to = parseFloat(el.dataset.count || "0");
      const padN = Number(el.dataset.pad || 0);
      const fmt = (n: number) => (padN ? String(n).padStart(padN, "0") : String(n));
      if (reduce) {
        el.textContent = fmt(to);
        return;
      }
      const t0 = performance.now();
      const dur = 1000;
      const step = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - t0) / dur));
        const val = Math.round(to * (1 - Math.pow(2, -9 * t)));
        el.textContent = fmt(val);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = fmt(to);
      };
      requestAnimationFrame(step);
    };

    const staggers = document.querySelectorAll<HTMLElement>("[data-stagger]");
    staggers.forEach((wrap) => {
      Array.from(wrap.children).forEach((child, idx) => {
        (child as HTMLElement).style.setProperty("--d", `${Math.min(idx, 8) * 45}ms`);
      });
    });

    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal],[data-count],[data-draw],[data-stagger]",
    );

    if (reduce || typeof IntersectionObserver === "undefined") {
      targets.forEach((el) => {
        el.classList.add("is-in");
        if (el.hasAttribute("data-count")) countUp(el);
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          el.classList.add("is-in");
          if (el.hasAttribute("data-count")) countUp(el);
          io.unobserve(el);
        });
      },
      { threshold: 0.04, rootMargin: "0px 0px -2% 0px" },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [depKey]);
}
