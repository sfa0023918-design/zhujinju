"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** The browser owns dragging and momentum; React only synchronizes the controls. */
export function useNativeCarousel({
  count,
  active,
  onChange,
  enabled = true,
  loop = false,
}: {
  count: number;
  active: number;
  onChange: (index: number) => void;
  enabled?: boolean;
  loop?: boolean;
}) {
  const [element, ref] = useState<HTMLDivElement | null>(null);
  const [interacting, setInteracting] = useState(false);
  const latest = useRef({ active, onChange });
  latest.current = { active, onChange };
  const reported = useRef(active);
  const navigating = useRef(false);
  const suppressClickUntil = useRef(0);
  const wrapped = loop && count > 1;
  const offset = wrapped ? 1 : 0;
  const indexes = Array.from({ length: count }, (_, index) => index);
  if (wrapped) indexes.splice(0, 0, count - 1);
  if (wrapped) indexes.push(0);

  useLayoutEffect(() => {
    if (!element || !enabled || !count) {
      setInteracting(false);
      return;
    }
    let held = false;
    let timer = 0;
    let frame = 0;
    let width = element.clientWidth;
    navigating.current = false;
    reported.current = latest.current.active;
    const jump = (index: number) => element.scrollTo({ left: index * width, behavior: "instant" });
    jump(latest.current.active + offset);

    const read = () => {
      if (navigating.current) return;
      const position = Math.round(element.scrollLeft / (width || 1));
      const index = wrapped
        ? (position - offset + count) % count
        : Math.max(0, Math.min(count - 1, position));
      if (index !== reported.current) {
        reported.current = index;
        latest.current.onChange(index);
      }
    };
    const settle = () => {
      if (held) return;
      navigating.current = false;
      read();
      const position = Math.round(element.scrollLeft / (width || 1));
      // Identical bookend panels make the reset invisible, after native momentum ends.
      if (wrapped && (position === 0 || position === count + 1)) jump(reported.current + offset);
      setInteracting(false);
    };
    const scroll = () => {
      suppressClickUntil.current = performance.now() + 180;
      setInteracting(true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 180);
    };
    const start = () => {
      held = true;
      navigating.current = false;
      setInteracting(true);
    };
    const end = () => {
      held = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 180);
    };
    const resize = new ResizeObserver(() => {
      const nextWidth = element.clientWidth;
      if (nextWidth === width) return;
      width = nextWidth;
      jump(latest.current.active + offset);
    });
    resize.observe(element);
    element.addEventListener("scroll", scroll, { passive: true });
    element.addEventListener("scrollend", settle);
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchend", end, { passive: true });
    element.addEventListener("touchcancel", end, { passive: true });
    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      element.removeEventListener("scroll", scroll);
      element.removeEventListener("scrollend", settle);
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", end);
    };
  }, [element, enabled, count, offset, wrapped]);

  useLayoutEffect(() => {
    if (!element || !enabled || active === reported.current) return;
    reported.current = active;
    navigating.current = true;
    let position = active + offset;
    const current = Math.round(element.scrollLeft / (element.clientWidth || 1));
    if (wrapped && active === 0 && current === count) position = count + 1;
    if (wrapped && active === count - 1 && current === 1) position = 0;
    element.scrollTo({
      left: position * element.clientWidth,
      // A distant dot selection should not travel through unrelated works.
      behavior: Math.abs(position - current) > 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }, [element, enabled, active, count, offset, wrapped]);

  return { ref, indexes, interacting, canClick: () => performance.now() > suppressClickUntil.current };
}
