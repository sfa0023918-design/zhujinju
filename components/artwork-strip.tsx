"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DirectionalArrow } from "./directional-arrow";
import styles from "./artwork-strip.module.css";

/** Controls for the native, single-row recommendations on touch layouts. */
export function ArtworkStrip({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ scrollable: false, start: true, end: false });

  useEffect(() => {
    const track = rootRef.current?.querySelector<HTMLElement>("[data-artwork-track]");
    if (!track) return;
    let frame = 0;
    const update = () => {
      const next = {
        scrollable: track.clientWidth > 0 && track.scrollWidth > track.clientWidth + 2,
        start: track.scrollLeft < 2,
        end: track.scrollLeft >= track.scrollWidth - track.clientWidth - 2,
      };
      setPosition((current) =>
        current.scrollable === next.scrollable && current.start === next.start && current.end === next.end
          ? current
          : next,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    for (const card of track.querySelectorAll("a")) observer.observe(card);
    track.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("scroll", schedule);
    };
  }, []);

  const move = (direction: number) => {
    const track = rootRef.current?.querySelector<HTMLElement>("[data-artwork-track]");
    if (!track) return;
    const left = track.getBoundingClientRect().left;
    const offsets = Array.from(track.querySelectorAll("a"), (card) =>
      card.getBoundingClientRect().left - left + track.scrollLeft,
    );
    const target = direction > 0
      ? offsets.find((offset) => offset > track.scrollLeft + 2)
      : offsets.reverse().find((offset) => offset < track.scrollLeft - 2);
    track.scrollTo({
      left: target ?? (direction > 0 ? track.scrollWidth : 0),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return (
    <div ref={rootRef}>
      {children}
      {position.scrollable ? (
        <div className={styles.controls}>
          <p>左右滑动浏览 <span lang="en">Swipe to explore</span></p>
          <div>
            <button type="button" aria-label="上一件推荐作品 / Previous related work" aria-controls="related-artworks-track" disabled={position.start} onClick={() => move(-1)}>
              <DirectionalArrow backwards />
            </button>
            <button type="button" aria-label="下一件推荐作品 / Next related work" aria-controls="related-artworks-track" disabled={position.end} onClick={() => move(1)}>
              <DirectionalArrow />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
