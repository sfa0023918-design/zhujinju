"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { DirectionalArrow } from "./directional-arrow";
import styles from "./home-highlights.module.css";

export function HomeHighlights({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    label: "1",
    start: true,
    end: count < 2,
    scrollable: false,
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;

    const update = () => {
      const bounds = track.getBoundingClientRect();
      const items = Array.from(track.children);
      const visible = items.flatMap((item, index) => {
        const rect = item.getBoundingClientRect();
        return rect.left >= bounds.left - 2 && rect.right <= bounds.right + 2
          ? [index + 1]
          : [];
      });
      const nearest = items.reduce(
        (best, item, index) => {
          const distance = Math.abs(
            item.getBoundingClientRect().left - bounds.left,
          );
          return distance < best.distance ? { index, distance } : best;
        },
        { index: 0, distance: Infinity },
      );
      setPosition({
        label:
          visible.length > 1
            ? `${visible[0]}–${visible[visible.length - 1]}`
            : String(visible[0] ?? nearest.index + 1),
        start: track.scrollLeft < 2,
        end: track.scrollLeft >= track.scrollWidth - track.clientWidth - 2,
        scrollable: track.scrollWidth > track.clientWidth + 2,
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    for (const item of track.children) observer.observe(item);
    track.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("scroll", schedule);
    };
  }, [count]);

  const move = (direction: number) => {
    const track = trackRef.current;
    if (!track || track.children.length < 2) return;
    const step =
      track.children[1].getBoundingClientRect().left -
      track.children[0].getBoundingClientRect().left;
    track.scrollBy({
      left: direction * step,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <>
      <div
        ref={trackRef}
        id="selected-highlights"
        className={styles.track}
        role="region"
        aria-label="精选藏品 / Selected highlights"
        tabIndex={position.scrollable ? 0 : undefined}
        onKeyDown={(event) => {
          if (
            position.scrollable &&
            (event.key === "ArrowRight" || event.key === "ArrowLeft")
          ) {
            event.preventDefault();
            move(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        {children}
      </div>
      {count > 1 ? (
        <div className={styles.controls}>
          <p>
            <span role="status" aria-atomic="true">
              {position.label} / {count}
            </span>
            <span>左右滑动浏览</span>
          </p>
          <div>
            <button
              type="button"
              aria-label="上一件藏品 / Previous artwork"
              aria-controls="selected-highlights"
              disabled={position.start}
              onClick={() => move(-1)}
            >
              <DirectionalArrow backwards />
            </button>
            <button
              type="button"
              aria-label="下一件藏品 / Next artwork"
              aria-controls="selected-highlights"
              disabled={position.end}
              onClick={() => move(1)}
            >
              <DirectionalArrow />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
