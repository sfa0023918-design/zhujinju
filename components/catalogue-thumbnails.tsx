"use client";

import { useEffect, useRef, useState } from "react";
import { ProtectedImage } from "./protected-image";
import styles from "./catalogue-thumbnails.module.css";

export function CatalogueThumbnails({ pages, currentIndex, paired = false, enabled = true, compact = false, onSelect }: {
  pages: string[];
  currentIndex: number;
  paired?: boolean;
  enabled?: boolean;
  compact?: boolean;
  onSelect: (index: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([currentIndex]));

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !enabled) return;
    if (typeof IntersectionObserver === "undefined") return;
    // Every plate is selectable, but only nearby small thumbnails are fetched.
    const observer = new IntersectionObserver((entries) => {
      const indexes = entries.filter((entry) => entry.isIntersecting).map((entry) => {
        observer.unobserve(entry.target);
        return Number((entry.target as HTMLElement).dataset.plateIndex);
      });
      if (indexes.length) setLoaded((current) => new Set([...current, ...indexes]));
    }, { root: track, rootMargin: "0px 160px", threshold: 0.01 });
    for (const thumbnail of track.querySelectorAll("[data-plate-index]")) observer.observe(thumbnail);
    return () => observer.disconnect();
  }, [pages, enabled]);

  useEffect(() => {
    const track = trackRef.current;
    const selected = track?.querySelector<HTMLElement>(`[data-plate-index="${currentIndex}"]`);
    if (!track || !selected || !enabled) return;
    setLoaded((current) => new Set([...current, currentIndex]));
    const left = selected.offsetLeft - (track.clientWidth - selected.clientWidth) / 2;
    const nearby = Math.abs(left - track.scrollLeft) < track.clientWidth;
    track.scrollTo({ left: Math.max(0, left), behavior: nearby && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  }, [currentIndex, enabled]);

  return (
    <div className={styles.browser} data-compact={compact} data-catalogue-thumbnails>
      {!compact ? <p>左右滑动选图 <span lang="en">Swipe to browse all plates</span></p> : null}
      <div ref={trackRef} className={styles.track} role="region" aria-label="整册图录缩略图 / All catalogue plates" tabIndex={0}>
        {pages.map((src, index) => (
          <button key={`${src}-${index}`} type="button" data-plate-index={index}
            aria-label={`查看图版 ${index + 1} / View plate ${index + 1}`}
            aria-current={index === currentIndex || (paired && index === currentIndex + 1) ? "page" : undefined}
            onFocus={() => setLoaded((current) => current.has(index) ? current : new Set([...current, index]))}
            onClick={() => onSelect(index)}>
            <span className={styles.imageFrame}>
              {loaded.has(index) ? <ProtectedImage src={src} alt="" fill unoptimized sizes="160px" loading="lazy" className={styles.image} /> : null}
            </span>
            <span>{String(index + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
