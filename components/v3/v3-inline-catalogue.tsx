"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { catalogueImageVariant, cataloguePageGeometry } from "@/lib/catalogue-media";
import type { Exhibition } from "@/lib/data/types";
import { withImageVersion } from "@/lib/image-url";
import { extractYear, padNumber } from "@/lib/v3-helpers";
import { attachDragScroll, Bi } from "./v3-ui";

type ResolvedCataloguePage = {
  index: number;
  readerSrc: string;
  thumbSrc: string;
  width: number;
  height: number;
  spread: boolean;
};

function parseCatalogueHash(): { pageIndex: number | null; openFull: boolean } {
  if (typeof window === "undefined") return { pageIndex: null, openFull: false };
  const h = window.location.hash || "";
  const m = h.match(/^#catalogue-p(\d+)$/i);
  if (m) {
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n >= 1) return { pageIndex: n - 1, openFull: false };
  }
  if (h === "#catalogue-full") {
    return { pageIndex: null, openFull: true };
  }
  return { pageIndex: null, openFull: false };
}

export function V3InlineCatalogue({
  exhibition,
  openFullscreenSignal = 0,
}: {
  exhibition: Exhibition;
  openFullscreenSignal?: number;
}) {
  const isSpreadMode = exhibition.catalogueViewMode !== "single-pages";

  const pages = useMemo<ResolvedCataloguePage[]>(() => {
    const raw = (exhibition.cataloguePageImages ?? []).filter(Boolean);
    return raw.map((src, index) => {
      const geo = cataloguePageGeometry(src, isSpreadMode);
      return {
        index,
        readerSrc: withImageVersion(catalogueImageVariant(src, "reader")),
        thumbSrc: withImageVersion(catalogueImageVariant(src, "thumb")),
        width: geo.width || (geo.spread ? 4000 : 2000),
        height: geo.height || 2358,
        spread: geo.spread,
      };
    });
  }, [exhibition.cataloguePageImages, isSpreadMode]);

  const [cur, setCur] = useState(0);
  const [displayedIdx, setDisplayedIdx] = useState(0);
  const [turnPhase, setTurnPhase] = useState<"idle" | "out" | "in">("idle");
  const [turnDir, setTurnDir] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [gridOpen, setGridOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const inlineStripRef = useRef<HTMLDivElement>(null);
  const fullStripRef = useRef<HTMLDivElement>(null);
  const inlineGridRef = useRef<HTMLDivElement>(null);
  const fullGridRef = useRef<HTMLDivElement>(null);
  const touchXRef = useRef<number | null>(null);
  const turnTimerRef = useRef<number | null>(null);

  // Open fullscreen modal when hero/section CTA signals it
  useEffect(() => {
    if (openFullscreenSignal > 0 && pages.length > 0) {
      setFullscreen(true);
      setGridOpen(false);
      setZoomed(false);
    }
  }, [openFullscreenSignal, pages.length]);

  // Reset when switching exhibitions
  useEffect(() => {
    setCur(0);
    setDisplayedIdx(0);
    setTurnPhase("idle");
    setZoomed(false);
    setGridOpen(false);
    setFullscreen(false);
  }, [exhibition.slug]);

  // Honour deep links like /exhibitions/himalayan-art-2026#catalogue-p74
  useEffect(() => {
    if (!pages.length) return;
    const applyHash = () => {
      const { pageIndex, openFull } = parseCatalogueHash();
      if (pageIndex !== null) {
        const clamped = Math.max(0, Math.min(pages.length - 1, pageIndex));
        setCur(clamped);
        setDisplayedIdx(clamped);
        setZoomed(false);
        setGridOpen(false);
        requestAnimationFrame(() => {
          document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" });
        });
      } else if (openFull) {
        setFullscreen(true);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [pages.length, exhibition.slug]);

  // Strictly finite neighbour-only full-res preloading (AGENTS.md Section 5)
  useEffect(() => {
    if (!pages.length) return;
    [cur - 1, cur + 1, cur + 2].forEach((idx) => {
      const target = pages[idx];
      if (target) {
        const im = new Image();
        im.src = target.readerSrc;
      }
    });
  }, [cur, pages]);

  // Lock body scroll while fullscreen studio modal is open
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  const showPage = useCallback(
    (nextIndex: number, dir?: number) => {
      if (!pages.length) return;
      const clamped = Math.max(0, Math.min(pages.length - 1, nextIndex));
      if (clamped === cur) return;
      const d = dir ?? (clamped > cur ? 1 : -1);
      setCur(clamped);
      setZoomed(false);
      setTurnDir(d);
      setTurnPhase("out");
      if (turnTimerRef.current) window.clearTimeout(turnTimerRef.current);
      turnTimerRef.current = window.setTimeout(() => {
        setDisplayedIdx(clamped);
        setTurnPhase("in");
      }, 140);
      // Keep URL hash synced cleanly without creating spammy history entries
      if (typeof window !== "undefined") {
        const targetHash = `#catalogue-p${clamped + 1}`;
        if (window.location.hash !== targetHash) {
          window.history.replaceState(window.history.state, "", targetHash);
        }
      }
    },
    [cur, pages.length],
  );

  useEffect(() => {
    return () => {
      if (turnTimerRef.current) window.clearTimeout(turnTimerRef.current);
    };
  }, []);

  // Keep active filmstrip thumbnail centered + hydrated
  const syncActiveStrip = useCallback((strip: HTMLDivElement | null, index: number, smooth: boolean) => {
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(`[data-rf="${index}"]`);
    if (!active) return;
    const im = active.querySelector<HTMLImageElement>("img[data-src]");
    if (im?.dataset.src) {
      im.src = im.dataset.src;
      im.removeAttribute("data-src");
    }
    const targetLeft = Math.max(0, active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2);
    strip.scrollTo({
      left: targetLeft,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    syncActiveStrip(inlineStripRef.current, cur, true);
    if (fullscreen) {
      syncActiveStrip(fullStripRef.current, cur, true);
    }
  }, [cur, fullscreen, syncActiveStrip]);

  // Lazy-hydrate horizontal filmstrip thumbnails via IntersectionObserver + wheel + drag
  const bindStrip = useCallback((strip: HTMLDivElement | null) => {
    if (!strip) return () => {};
    const imgs = Array.from(strip.querySelectorAll<HTMLImageElement>("img[data-src]"));
    const loadImg = (im: HTMLImageElement) => {
      if (im.dataset.src) {
        im.src = im.dataset.src;
        im.removeAttribute("data-src");
      }
    };
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            loadImg(en.target as HTMLImageElement);
            io?.unobserve(en.target);
          });
        },
        { root: strip, rootMargin: "0px 420px", threshold: 0.01 },
      );
      imgs.forEach((im) => io?.observe(im));
    } else {
      imgs.forEach(loadImg);
    }

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        strip.scrollLeft += e.deltaY;
      }
    };
    strip.addEventListener("wheel", onWheel, { passive: false });
    const detachDrag = attachDragScroll(strip);

    return () => {
      io?.disconnect();
      strip.removeEventListener("wheel", onWheel);
      detachDrag();
    };
  }, []);

  useEffect(() => bindStrip(inlineStripRef.current), [bindStrip, exhibition.slug, pages.length]);
  useEffect(() => {
    if (!fullscreen) return;
    const cleanup = bindStrip(fullStripRef.current);
    const raf = requestAnimationFrame(() => syncActiveStrip(fullStripRef.current, cur, false));
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [fullscreen, bindStrip, cur, syncActiveStrip]);

  // Lazy-hydrate directory grid when opened
  useEffect(() => {
    if (!gridOpen) return;
    const grid = fullscreen ? fullGridRef.current : inlineGridRef.current;
    if (!grid) return;
    const imgs = Array.from(grid.querySelectorAll<HTMLImageElement>("img[data-src]"));
    const loadImg = (im: HTMLImageElement) => {
      if (im.dataset.src) {
        im.src = im.dataset.src;
        im.removeAttribute("data-src");
      }
    };
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            loadImg(en.target as HTMLImageElement);
            io?.unobserve(en.target);
          });
        },
        { root: grid, rootMargin: "260px 0px", threshold: 0.01 },
      );
      imgs.forEach((im) => io?.observe(im));
    } else {
      imgs.forEach(loadImg);
    }
    grid.querySelector<HTMLElement>(`[data-go="${cur}"]`)?.scrollIntoView({ block: "center" });
    return () => io?.disconnect();
  }, [gridOpen, fullscreen, cur]);

  // Keyboard shortcuts when fullscreen modal or directory grid is active
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.matches?.("input,textarea,select")) return;
      if (e.key === "Escape") {
        if (gridOpen) setGridOpen(false);
        else if (fullscreen) setFullscreen(false);
        return;
      }
      if (fullscreen) {
        if (e.key === "ArrowRight") showPage(cur + 1, 1);
        else if (e.key === "ArrowLeft") showPage(cur - 1, -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cur, fullscreen, gridOpen, showPage]);

  if (!pages.length) return null;

  const year = extractYear(exhibition.period.zh);
  const catTitle = exhibition.catalogueTitle?.zh ? exhibition.catalogueTitle : exhibition.title;
  const displayed = pages[displayedIdx] ?? pages[0];
  const turnClass =
    turnPhase === "out" ? " turn-out" : turnPhase === "in" ? " turn-in" : "";

  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoomOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const renderReaderBody = (isFull: boolean) => (
    <>
      <div className={isFull ? "reader-stage" : "ir-stage"}>
        <button
          type="button"
          className="reader-hit reader-prev"
          aria-label="上一页"
          disabled={cur <= 0}
          onClick={() => showPage(cur - 1, -1)}
        >
          <span>←</span>
        </button>
        <div
          className={`reader-page${displayed.spread ? " is-spread" : ""}${zoomed ? " is-zoom" : ""}${turnClass}`}
          style={{ ["--dir" as string]: turnDir }}
          onDoubleClick={() => setZoomed((z) => !z)}
          onMouseMove={handlePageMouseMove}
          onTouchStart={(e) => {
            touchXRef.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchXRef.current === null) return;
            const dx = e.changedTouches[0].clientX - touchXRef.current;
            if (Math.abs(dx) > 40) showPage(cur + (dx < 0 ? 1 : -1));
            touchXRef.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayed.readerSrc}
            alt={`${exhibition.title.zh} 第 ${displayed.index + 1} 页`}
            style={{ transformOrigin: zoomOrigin }}
          />
        </div>
        <button
          type="button"
          className="reader-hit reader-next"
          aria-label="下一页"
          disabled={cur >= pages.length - 1}
          onClick={() => showPage(cur + 1, 1)}
        >
          <span>→</span>
        </button>
      </div>

      <div className={isFull ? "reader-bottom" : "ir-bottom"}>
        <div className="reader-scrub-row">
          <span className="reader-scrub-label">
            <b>{padNumber(cur + 1, 3)}</b> / {padNumber(pages.length, 3)}
          </span>
          <input
            type="range"
            min={1}
            max={pages.length}
            value={cur + 1}
            aria-label="浏览图录页码"
            onChange={(e) => showPage(Number(e.target.value) - 1)}
          />
          <span className="reader-hint">
            <span className="t-zh">
              {isFull ? "← → 翻页 · 双击放大" : "点选缩略图或拖动滑轨 · 双击放大"}
            </span>
            <span className="t-en" lang="en">
              {isFull ? "← → turn · dbl-click zoom" : "Select spread or scrub · dbl-click zoom"}
            </span>
          </span>
        </div>

        <div
          ref={isFull ? fullStripRef : inlineStripRef}
          className="reader-filmstrip"
          role="group"
          aria-label="整册图录页面选择"
        >
          {pages.map((p, k) => {
            const eager = Math.abs(k - cur) <= 12;
            const ratio = Math.max(0.55, Math.min(1.85, p.width / Math.max(1, p.height)));
            return (
              <button
                key={p.index}
                type="button"
                className={`rf-item${k === cur ? " is-active" : ""}${p.spread ? " is-spread" : ""}`}
                data-rf={k}
                aria-label={`第 ${k + 1} 页`}
                aria-current={k === cur ? "page" : undefined}
                onClick={() => showPage(k)}
              >
                <span
                  className="rf-frame"
                  style={{ ["--rf-ratio" as string]: ratio.toFixed(4) }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={eager ? p.thumbSrc : undefined}
                    data-src={eager ? undefined : p.thumbSrc}
                    alt=""
                    draggable={false}
                  />
                </span>
                <em>{padNumber(k + 1, 3)}</em>
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={isFull ? fullGridRef : inlineGridRef}
        className={`reader-grid${gridOpen && isFull === fullscreen ? " is-open" : ""}`}
        aria-hidden={!(gridOpen && isFull === fullscreen)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setGridOpen(false);
        }}
      >
        <div className="reader-grid-head">
          <span className="micro-label">
            <Bi text={catTitle} /> · {pages.length}{" "}
            <span className="t-zh">页</span>
            <span className="t-en" lang="en">
              pp.
            </span>
          </span>
          <button type="button" className="stage-tool" onClick={() => setGridOpen(false)}>
            <span className="t-zh">关闭目录</span>
            <span className="t-en" lang="en">
              Close
            </span>{" "}
            ×
          </button>
        </div>
        <div className="reader-grid-inner">
          {pages.map((p, k) => (
            <button
              key={p.index}
              type="button"
              className={`rg-thumb${p.spread ? " is-spread" : ""}${k === cur ? " is-active" : ""}`}
              data-go={k}
              onClick={() => {
                showPage(k);
                setGridOpen(false);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-src={p.thumbSrc} alt="" />
              <span>{padNumber(k + 1, 3)}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="container">
        <div className="v3-inline-reader" id="inline-reader">
          <div className="ir-top">
            <div className="ir-meta">
              <span className="micro-label">
                {year} · <span className="t-zh">在线电子图录</span>
                <span className="t-en" lang="en">
                  Digital Monograph
                </span>
              </span>
              <b>
                <Bi text={catTitle} />
              </b>
            </div>
            <div className="ir-tools">
              <span className="ir-count">
                <b>{padNumber(cur + 1, 3)}</b> / {padNumber(pages.length, 3)}
              </span>
              <button
                type="button"
                className={`stage-tool${zoomed && !fullscreen ? " is-on" : ""}`}
                onClick={() => setZoomed((z) => !z)}
              >
                <span className="t-zh">放大</span>
                <span className="t-en" lang="en">
                  Zoom
                </span>
              </button>
              <button
                type="button"
                className="stage-tool"
                onClick={() => setGridOpen((g) => !g)}
              >
                <span className="t-zh">目录</span>
                <span className="t-en" lang="en">
                  Pages
                </span>
              </button>
              <button
                type="button"
                className="stage-tool ir-full-btn"
                onClick={() => {
                  setGridOpen(false);
                  setZoomed(false);
                  setFullscreen(true);
                }}
              >
                <span className="t-zh">全屏</span>
                <span className="t-en" lang="en">
                  Full
                </span>{" "}
                ↗
              </button>
            </div>
          </div>

          {renderReaderBody(false)}
        </div>
      </div>

      {/* Immersive Full-Screen Studio Modal */}
      {fullscreen ? (
        <div
          className="v3-reader-modal"
          role="dialog"
          aria-modal="true"
          aria-label="电子图录全屏阅读器"
        >
          <section className="v3-reader">
            <div className="reader-top">
              <button
                type="button"
                className="v3-crumb v3-crumb-light"
                onClick={() => {
                  setGridOpen(false);
                  setZoomed(false);
                  setFullscreen(false);
                }}
              >
                ← <span className="t-zh">返回展览</span>
                <span className="t-en" lang="en">
                  Back
                </span>
              </button>
              <div className="reader-title">
                <span className="micro-label">
                  {year} · <span className="t-zh">电子图录</span>
                  <span className="t-en" lang="en">
                    Catalogue
                  </span>
                </span>
                <b>
                  <Bi text={exhibition.title} />
                </b>
              </div>
              <div className="reader-tools">
                <span className="reader-count">
                  <b>{padNumber(cur + 1, 3)}</b> / {padNumber(pages.length, 3)}
                </span>
                <button
                  type="button"
                  className={`stage-tool${zoomed ? " is-on" : ""}`}
                  onClick={() => setZoomed((z) => !z)}
                >
                  <span className="t-zh">放大</span>
                  <span className="t-en" lang="en">
                    Zoom
                  </span>
                </button>
                <button
                  type="button"
                  className="stage-tool"
                  onClick={() => setGridOpen((g) => !g)}
                >
                  <span className="t-zh">目录</span>
                  <span className="t-en" lang="en">
                    Pages
                  </span>
                </button>
              </div>
            </div>

            {renderReaderBody(true)}
          </section>
        </div>
      ) : null}
    </>
  );
}
