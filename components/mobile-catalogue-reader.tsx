"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { BilingualText } from "@/lib/site-data";
import type { CataloguePageGeometry } from "@/lib/catalogue-media";
import { clampCataloguePan, moveCataloguePosition } from "@/lib/catalogue-reading";
import { ProtectedImage } from "./protected-image";
import styles from "./mobile-catalogue-reader.module.css";

type Props = {
  title: BilingualText;
  pages: string[];
  readerPages: string[];
  thumbPages: string[];
  geometries: CataloguePageGeometry[];
  pairSingleImages: boolean;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onFullscreenChange: (open: boolean) => void;
};
type Point = { x: number; y: number };
type Transform = Point & { scale: number };
const fitted: Transform = { scale: 1, x: 0, y: 0 };
// The full-screen reader adds one step to the browser history, so the phone's back
// button or back swipe closes the reader instead of leaving the exhibition page.
const READER_HISTORY_KEY = "zhujinju:catalogue-reader";

function isReaderHistoryEntry(state: unknown) {
  return Boolean(state && typeof state === "object" && (state as Record<string, unknown>)[READER_HISTORY_KEY]);
}

function Chevron({ next = false }: { next?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={next ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} stroke="currentColor" strokeWidth="1.4" /></svg>;
}

export function MobileCatalogueReader({ title, pages, readerPages, thumbPages, geometries, pairSingleImages, currentIndex, onIndexChange, onFullscreenChange }: Props) {
  const hasRightCover = geometries[0]?.openingSide === "right";
  const [half, setHalf] = useState<0 | 1>(hasRightCover ? 1 : 0);
  const [singlePage, setSinglePage] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [transform, setTransform] = useState<Transform>(fitted);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const points = useRef(new Map<number, Point>());
  const gesture = useRef<{ start: Transform; origin: Point; distance: number; dragged: boolean; multi: boolean } | null>(null);
  const tap = useRef(0);
  const inlineTouch = useRef<Point | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const update = () => { setSinglePage(media.matches); setTransform(fitted); };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const returnFocus = openButtonRef.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      document.body.style.overflow = oldOverflow;
      dialog?.close();
      returnFocus?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePopState = (event: PopStateEvent) => {
      if (isReaderHistoryEntry(event.state)) return;
      setIsOpen(false);
      onFullscreenChange(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, onFullscreenChange]);

  const position = { index: currentIndex, half };
  const previous = moveCataloguePosition(position, -1, geometries, singlePage, pairSingleImages);
  const next = moveCataloguePosition(position, 1, geometries, singlePage, pairSingleImages);
  const canPrevious = previous.index !== currentIndex || previous.half !== half;
  const canNext = next.index !== currentIndex || next.half !== half;
  const geometry = geometries[currentIndex];
  const splitPage = singlePage && geometry.spread;
  const pairedPages = !singlePage && pairSingleImages && currentIndex + 1 < pages.length;
  const sourceRatio = geometry.width / geometry.height;
  const secondRatio = pairedPages ? geometries[currentIndex + 1].width / geometries[currentIndex + 1].height : 0;
  const displayRatio = pairedPages ? sourceRatio + secondRatio : splitPage ? sourceRatio / 2 : sourceRatio;
  const pageLabel = currentIndex === 0 && hasRightCover ? "封面" : splitPage ? half === 0 ? "左页" : "右页" : geometry.spread ? "完整跨页" : pairedPages ? "双页" : "单页";
  const progress = `图版 ${currentIndex + 1}${pairedPages ? `–${currentIndex + 2}` : ""} / ${pages.length} · ${pageLabel}`;
  const nearbyIndexes = Array.from({ length: Math.min(5, pages.length) }, (_, slot) => Math.max(0, Math.min(currentIndex - 2, pages.length - 5)) + slot);

  function move(direction: -1 | 1) {
    const target = direction === 1 ? next : previous;
    onIndexChange(target.index);
    setHalf(target.half);
    setTransform(fitted);
    points.current.clear();
    gesture.current = null;
  }

  function jump(index: number) {
    onIndexChange(index);
    setHalf(index === 0 && hasRightCover ? 1 : 0);
    setTransform(fitted);
  }

  function zoom(scale: number, anchor?: Point) {
    const boundedScale = Math.min(5, Math.max(1, scale));
    const page = pageRef.current;
    setTransform((old) => {
      const rect = page?.getBoundingClientRect();
      const ratio = boundedScale / old.scale;
      const x = anchor && rect ? old.x * ratio - (anchor.x - rect.left - rect.width / 2) * ratio : old.x;
      const y = anchor && rect ? old.y * ratio - (anchor.y - rect.top - rect.height / 2) * ratio : old.y;
      return { scale: boundedScale, ...clampCataloguePan(x, y, boundedScale, page?.clientWidth ?? 0, page?.clientHeight ?? 0) };
    });
  }

  function openReader() {
    setTransform(fitted);
    setIsOpen(true);
    onFullscreenChange(true);
    if (!isReaderHistoryEntry(window.history.state)) {
      window.history.pushState({ [READER_HISTORY_KEY]: true }, "");
    }
  }

  function closeReader() {
    if (isReaderHistoryEntry(window.history.state)) {
      // Step back out of the reader's history entry; the popstate listener closes it.
      window.history.back();
      return;
    }
    setIsOpen(false);
    onFullscreenChange(false);
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const values = [...points.current.values()];
    const origin = values.length > 1 ? { x: (values[0].x + values[1].x) / 2, y: (values[0].y + values[1].y) / 2 } : values[0];
    const distance = values.length > 1 ? Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y) : 0;
    gesture.current = { start: transform, origin, distance, dragged: false, multi: values.length > 1 };
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!points.current.has(event.pointerId) || !gesture.current) return;
    points.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const values = [...points.current.values()];
    const initial = gesture.current;
    const midpoint = values.length > 1 ? { x: (values[0].x + values[1].x) / 2, y: (values[0].y + values[1].y) / 2 } : values[0];
    const dx = midpoint.x - initial.origin.x;
    const dy = midpoint.y - initial.origin.y;
    const distance = values.length > 1 ? Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y) : 0;
    const scale = initial.distance ? Math.min(5, Math.max(1, initial.start.scale * distance / initial.distance)) : initial.start.scale;
    initial.dragged ||= Math.abs(dx) + Math.abs(dy) > 8 || Math.abs(scale - initial.start.scale) > 0.03;
    const page = pageRef.current;
    if (!page) return;
    const rect = page.getBoundingClientRect();
    const ratio = scale / initial.start.scale;
    const anchorX = initial.origin.x - rect.left - rect.width / 2;
    const anchorY = initial.origin.y - rect.top - rect.height / 2;
    const x = initial.start.x * ratio + anchorX * (1 - ratio) + dx;
    const y = initial.start.y * ratio + anchorY * (1 - ratio) + dy;
    setTransform({ scale, ...clampCataloguePan(x, y, scale, page.clientWidth, page.clientHeight) });
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const initial = gesture.current;
    points.current.delete(event.pointerId);
    if (points.current.size) {
      const origin = [...points.current.values()][0];
      gesture.current = { start: transform, origin, distance: 0, dragged: true, multi: true };
      return;
    }
    gesture.current = null;
    if (!initial || cancelled) return;
    if (initial.multi) { tap.current = 0; return; }
    const dx = event.clientX - initial.origin.x;
    const dy = event.clientY - initial.origin.y;
    if (initial.start.scale === 1 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      move(dx < 0 ? 1 : -1);
    } else if (!initial.dragged) {
      const now = Date.now();
      if (now - tap.current < 300) { zoom(transform.scale > 1 ? 1 : 3, { x: event.clientX, y: event.clientY }); tap.current = 0; }
      else tap.current = now;
    }
  }

  function sheet(source: string, full = false) {
    return <div className={styles.sheet} style={full ? { transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` } : undefined}>
      <div className={`${styles.imageWindow} ${splitPage ? styles.doubleWidth : ""}`} style={splitPage ? { left: half === 1 ? "-100%" : "0" } : pairedPages ? { width: `${sourceRatio / displayRatio * 100}%`, right: "auto" } : undefined}>
        <ProtectedImage src={source} alt={`${title.zh || title.en}，${progress}`} fill unoptimized sizes={full ? "2000px" : "100vw"} loading="eager" className={styles.image} />
      </div>
      {pairedPages && <div className={styles.imageWindow} style={{ left: `${sourceRatio / displayRatio * 100}%` }}>
        <ProtectedImage src={full ? pages[currentIndex + 1] : readerPages[currentIndex + 1]} alt={`${title.zh || title.en}，图版 ${currentIndex + 2}`} fill unoptimized sizes={full ? "2000px" : "100vw"} loading="eager" className={styles.image} />
      </div>}
    </div>;
  }

  function controls(full = false) {
    return <div className={styles.controls}>
      <button type="button" aria-label="上一页" disabled={!canPrevious} onClick={() => move(-1)}><Chevron /></button>
      <span aria-live="polite" className={full ? styles.fullProgress : undefined}>{progress}
        {full && <select aria-label="全屏跳至图版" value={currentIndex} onChange={(event) => jump(Number(event.target.value))}>
          {pages.map((source, index) => <option key={source} value={index}>{`图版 ${index + 1} / ${pages.length}`}</option>)}
        </select>}
      </span>
      <button type="button" aria-label="下一页" disabled={!canNext} onClick={() => move(1)}><Chevron next /></button>
      {!full && <button type="button" className={styles.open} onClick={openReader}>全屏</button>}
    </div>;
  }

  return <div id="catalogue-reader" className={styles.reader} data-mobile-catalogue="true" style={{ "--catalogue-ratio": displayRatio } as CSSProperties}>
    <button type="button" ref={openButtonRef} className={styles.preview} aria-label="打开全屏图录阅读" onClick={openReader}
      onTouchStart={(event) => { inlineTouch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }}
      onTouchEnd={(event) => {
        const start = inlineTouch.current;
        inlineTouch.current = null;
        if (!start) return;
        const end = event.changedTouches[0];
        const dx = end.clientX - start.x;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(end.clientY - start.y) * 1.5) { event.preventDefault(); move(dx < 0 ? 1 : -1); }
      }}>
      {sheet(readerPages[currentIndex])}
    </button>
    {controls()}
    <p className={styles.hint}>点开全屏，双指放大阅读</p>
    <details className={styles.index}>
      <summary>图版索引 <span>Plate index</span></summary>
      <label className={styles.jump}>跳至图版
        <select aria-label="跳至图版" value={currentIndex} onChange={(event) => jump(Number(event.target.value))}>
          {pages.map((source, index) => <option key={source} value={index}>{index + 1}{index === 0 && hasRightCover ? " · 封面" : ""}</option>)}
        </select>
      </label>
      <div className={styles.thumbnails}>
        {nearbyIndexes.map((index) => <button type="button" key={index} aria-label={`打开图版 ${index + 1}`} aria-current={index === currentIndex ? "page" : undefined} onClick={() => jump(index)}>
          <span className={styles.thumbnail}><ProtectedImage src={thumbPages[index]} alt="" fill unoptimized sizes="120px" loading="lazy" className={styles.image} /></span>
          <span>{String(index + 1).padStart(2, "0")}</span>
        </button>)}
      </div>
    </details>
    {isOpen && <dialog ref={dialogRef} className={styles.dialog} aria-label="全屏图录阅读" onCancel={closeReader} onKeyDown={(event) => {
      if (["INPUT", "SELECT"].includes((event.target as HTMLElement).tagName)) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
    }}>
      <div className={styles.fullReader}>
        <header className={styles.toolbar}><span>图录阅读 / Catalogue</span><button type="button" onClick={closeReader}>关闭 Close</button></header>
        <div className={styles.canvas} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={(event) => pointerUp(event)} onPointerCancel={(event) => pointerUp(event, true)}>
          <div ref={pageRef} className={styles.fit}>{sheet(pages[currentIndex], true)}</div>
        </div>
        <div className={styles.zoomControls}>
          <button type="button" aria-label="缩小" disabled={transform.scale === 1} onClick={() => zoom(transform.scale - 0.5)}>−</button>
          <button type="button" aria-label="恢复适屏" onClick={() => setTransform(fitted)}>{Math.round(transform.scale * 100)}%</button>
          <button type="button" aria-label="放大" disabled={transform.scale === 5} onClick={() => zoom(transform.scale + 0.5)}>+</button>
          <span>双指缩放 · 双击放大 · 拖动查看</span>
        </div>
        {controls(true)}
      </div>
    </dialog>}
  </div>;
}
