"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { packArtworkRows } from "@/lib/artwork-rows";
import { artworkMatchesFilter } from "@/lib/collection-facets";
import type { CollectionArtworkSummary } from "@/lib/collection-filtering";
import {
  getArtworkCardSrc,
  getArtworkFacts,
  getArtworkRatio,
  getPaginationItems,
  getV3CategoryKey,
  padNumber,
  type V3CategoryKey,
} from "@/lib/v3-helpers";
import { useV3 } from "./v3-shell";
import { Bi, StatusPill, useV3Reveal } from "./v3-ui";

type StatusFilter = "all" | "inquiry" | "sold";
type ViewMode = "wall" | "index";

const CAT_TABS: ReadonlyArray<{ key: V3CategoryKey; zh: string; en: string }> = [
  { key: "all", zh: "全部", en: "All" },
  { key: "sculpture", zh: "造像", en: "Sculpture" },
  { key: "painting", zh: "唐卡与绘画", en: "Painting" },
  { key: "manuscript", zh: "经书", en: "Manuscripts" },
  { key: "ritual", zh: "法器与工艺", en: "Ritual & Craft" },
];

const STATUS_TABS: ReadonlyArray<{ key: StatusFilter; zh: string; en: string }> = [
  { key: "all", zh: "全部", en: "All" },
  { key: "inquiry", zh: "可洽询", en: "Available" },
  { key: "sold", zh: "已洽购", en: "Acquired" },
];

function mapIncomingCategoryParam(param: string | null): V3CategoryKey {
  if (!param || param === "all" || param === "全部") return "all";
  if (param === "sculpture" || param === "painting" || param === "manuscript" || param === "ritual") {
    return param;
  }
  return getV3CategoryKey({ category: { zh: param, en: param } });
}

export function V3Collection({ artworks }: { artworks: CollectionArtworkSummary[] }) {
  const { lang } = useV3();
  const searchParams = useSearchParams();
  const [cat, setCat] = useState<V3CategoryKey>(() =>
    mapIncomingCategoryParam(searchParams.get("cat") ?? searchParams.get("category")),
  );
  const [status, setStatus] = useState<StatusFilter>(() => {
    const s = searchParams.get("status");
    return s === "sold" || s === "inquiry" ? s : "all";
  });
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [view, setView] = useState<ViewMode>(() =>
    searchParams.get("view") === "index" ? "index" : "wall",
  );
  const [page, setPage] = useState<number>(() =>
    Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1),
  );
  // Preserve legacy deep links (?region=...&period=...&material=...) cleanly
  const [legacyRegion, setLegacyRegion] = useState(() => searchParams.get("region") ?? "");
  const [legacyPeriod, setLegacyPeriod] = useState(() => searchParams.get("period") ?? "");
  const [legacyMaterial, setLegacyMaterial] = useState(() => searchParams.get("material") ?? "");

  const [mode, setMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [modeReady, setModeReady] = useState(false);
  const toolbarAnchorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const pendingScrollRef = useRef<"results" | "toolbar-if-below" | null>(null);
  const catSegRef = useRef<HTMLDivElement>(null);
  const statusSegRef = useRef<HTMLDivElement>(null);
  const viewSegRef = useRef<HTMLDivElement>(null);

  useV3Reveal(`collection-${cat}-${status}-${view}-${page}`);

  // Measure responsive breakpoint cleanly after hydration
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setMode(w >= 1081 ? "desktop" : w >= 760 ? "tablet" : "mobile");
      setModeReady(true);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  // Sync sliding white thumbs inside segmented controls
  const syncThumbs = useCallback(() => {
    [catSegRef.current, statusSegRef.current, viewSegRef.current].forEach((seg) => {
      if (!seg) return;
      const thumb = seg.querySelector<HTMLElement>(".seg-thumb");
      const active = seg.querySelector<HTMLElement>(".seg-btn.is-active");
      if (thumb && active && active.offsetWidth > 0) {
        thumb.style.width = `${active.offsetWidth}px`;
        thumb.style.transform = `translate3d(${active.offsetLeft}px, 0, 0)`;
      }
    });
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(syncThumbs));
    window.addEventListener("resize", syncThumbs, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", syncThumbs);
    };
  }, [cat, status, view, mode, syncThumbs]);

  const indexMap = useMemo(() => {
    const m = new Map<string, number>();
    artworks.forEach((a, i) => m.set(a.slug, i));
    return m;
  }, [artworks]);

  const counts = useMemo(() => {
    const c: Record<V3CategoryKey, number> = {
      all: artworks.length,
      sculpture: 0,
      painting: 0,
      manuscript: 0,
      ritual: 0,
    };
    artworks.forEach((a) => {
      c[getV3CategoryKey(a)] += 1;
    });
    return c;
  }, [artworks]);

  const availableCount = useMemo(
    () => artworks.filter((a) => a.status !== "sold").length,
    [artworks],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artworks.filter((a) => {
      if (cat !== "all" && getV3CategoryKey(a) !== cat) return false;
      if (status === "sold" && a.status !== "sold") return false;
      if (status === "inquiry" && a.status === "sold") return false;
      if (legacyRegion && !artworkMatchesFilter(a, "region", legacyRegion)) return false;
      if (legacyPeriod && !artworkMatchesFilter(a, "period", legacyPeriod)) return false;
      if (legacyMaterial && !artworkMatchesFilter(a, "material", legacyMaterial)) return false;
      if (q) {
        const hay = [
          a.title.zh,
          a.title.en,
          a.region.zh,
          a.region.en,
          a.period.zh,
          a.period.en,
          a.material.zh,
          a.material.en,
          a.category.zh,
          a.category.en,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [artworks, cat, status, query, legacyRegion, legacyPeriod, legacyMaterial]);

  // Live-aligned page sizes: Desktop 15 / Tablet & Mobile 6
  const pageSize = mode === "desktop" ? 15 : 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const shown = useMemo(
    () => filtered.slice(start, start + pageSize),
    [filtered, start, pageSize],
  );

  // Finite next-page card-thumbnail pre-warming (max 6 small cards, never whole collection)
  useEffect(() => {
    if (!modeReady || currentPage >= totalPages) return;
    const nextSlice = filtered.slice(start + pageSize, start + pageSize + Math.min(pageSize, 6));
    if (!nextSlice.length) return;
    const timer = window.setTimeout(() => {
      nextSlice.forEach((a) => {
        const src = getArtworkCardSrc(a);
        if (!src) return;
        const im = new Image();
        im.decoding = "async";
        im.src = src;
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [modeReady, filtered, start, pageSize, currentPage, totalPages]);

  // Sync URL query params cleanly without triggering server rerender or losing history state
  useEffect(() => {
    if (!modeReady) return;
    const p = new URLSearchParams();
    if (cat !== "all") p.set("cat", cat);
    if (status !== "all") p.set("status", status);
    if (view !== "wall") p.set("view", view);
    if (query.trim()) p.set("q", query.trim());
    if (legacyRegion) p.set("region", legacyRegion);
    if (legacyPeriod) p.set("period", legacyPeriod);
    if (legacyMaterial) p.set("material", legacyMaterial);
    if (currentPage > 1) p.set("page", String(currentPage));
    const qs = p.toString();
    const target = qs ? `/collection?${qs}` : "/collection";
    if (`${window.location.pathname}${window.location.search}` !== target) {
      window.history.replaceState(window.history.state, "", target);
    }
  }, [modeReady, cat, status, view, query, legacyRegion, legacyPeriod, legacyMaterial, currentPage]);

  const rows = useMemo(() => {
    const packed = packArtworkRows(shown.map(getArtworkRatio), mode, { fillRows: true });
    // Prevent a lone narrow search result on desktop/tablet from blowing up to 1360px wide
    const target = mode === "desktop" ? 2.75 : 2;
    return packed.map((row) => {
      const loneNarrow =
        mode !== "mobile" && row.ratios.length === 1 && row.ratios[0] < 1.35;
      return {
        ...row,
        spacer: loneNarrow ? Math.max(0, target - row.ratios[0]) : 0,
      };
    });
  }, [shown, mode]);

  const hasFilter = Boolean(
    cat !== "all" ||
      status !== "all" ||
      query.trim() ||
      legacyRegion ||
      legacyPeriod ||
      legacyMaterial,
  );
  const from = filtered.length ? start + 1 : 0;
  const to = start + shown.length;
  const pageNumbers = getPaginationItems(currentPage, totalPages);

  const scrollToCollectionPosition = useCallback((kind: "results" | "toolbar-if-below") => {
    const headerH = document.getElementById("site-header")?.getBoundingClientRect().height || 64;
    // Use non-sticky anchors so sticky .v3-toolbar never reports current viewport Y
    const isMobile = window.innerWidth < 760;
    const anchor =
      kind === "results" && isMobile
        ? resultsRef.current ?? toolbarAnchorRef.current
        : toolbarAnchorRef.current ?? resultsRef.current;
    if (!anchor) return;
    const targetTop = Math.max(
      0,
      Math.round(anchor.getBoundingClientRect().top + window.scrollY - headerH - (isMobile ? 8 : 10)),
    );
    if (kind === "toolbar-if-below" && window.scrollY <= targetTop + 24) {
      return;
    }
    window.scrollTo({ top: targetTop, left: 0, behavior: "instant" });
  }, []);

  // Execute pagination / filter scroll AFTER React commits the new page so iOS Safari never cancels or anchors to the bottom pager
  useEffect(() => {
    const pending = pendingScrollRef.current;
    if (!pending) return;
    pendingScrollRef.current = null;
    scrollToCollectionPosition(pending);
    const raf = requestAnimationFrame(() => scrollToCollectionPosition(pending));
    return () => cancelAnimationFrame(raf);
  }, [currentPage, cat, status, view, legacyRegion, legacyPeriod, legacyMaterial, scrollToCollectionPosition]);

  const resetAll = () => {
    pendingScrollRef.current = "toolbar-if-below";
    setCat("all");
    setStatus("all");
    setQuery("");
    setLegacyRegion("");
    setLegacyPeriod("");
    setLegacyMaterial("");
    setPage(1);
  };

  const goPage = (next: number) => {
    const clamped = Math.max(1, Math.min(totalPages, next));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (clamped === currentPage) {
      scrollToCollectionPosition("results");
      return;
    }
    pendingScrollRef.current = "results";
    setPage(clamped);
  };

  return (
    <>
      <section className="v3-page-head container">
        <p className="micro-label v3-eyebrow">COLLECTION · 藏品</p>
        <div className="v3-head-row">
          <h1 className="v3-h1">
            <span className="t-zh">藏品</span>
            <span className="t-en" lang="en">
              Collection
            </span>
          </h1>
          <div className="v3-head-stats">
            <div>
              <b data-count={artworks.length}>{artworks.length}</b>
              <span>
                <span className="t-zh">件作品</span>
                <span className="t-en">works</span>
              </span>
            </div>
            <div>
              <b data-count={availableCount}>{availableCount}</b>
              <span>
                <span className="t-zh">件可洽询</span>
                <span className="t-en">available</span>
              </span>
            </div>
          </div>
        </div>
        <p className="v3-lead">
          <span className="t-zh">
            按类别、状态或关键词浏览。点开作品可切换暗房光与日间光、用放大镜细看局部，并直接发起洽询。
          </span>
          <span className="t-en" lang="en">
            Browse by category, status or keyword. Each work opens into a viewing room with
            lighting modes, a loupe, and direct inquiry.
          </span>
        </p>
      </section>

      <div ref={toolbarAnchorRef} className="v3-col-anchor" aria-hidden="true" />
      <div className="v3-toolbar" id="col-toolbar" ref={toolbarRef}>
        <div className="container v3-toolbar-inner">
          <div className="segmented-control" role="group" aria-label="类别" ref={catSegRef}>
            <div className="seg-thumb" aria-hidden="true" />
            {CAT_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`seg-btn${cat === t.key ? " is-active" : ""}`}
                onClick={() => {
                  pendingScrollRef.current = "toolbar-if-below";
                  setCat(t.key);
                  setPage(1);
                }}
              >
                <span className="t-zh">{t.zh}</span>
                <span className="t-en">{t.en}</span>
                <span className="seg-count">{counts[t.key]}</span>
              </button>
            ))}
          </div>

          <div className="v3-toolbar-right">
            <div className="segmented-control seg-sm" role="group" aria-label="状态" ref={statusSegRef}>
              <div className="seg-thumb" aria-hidden="true" />
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`seg-btn${status === t.key ? " is-active" : ""}`}
                  onClick={() => {
                    pendingScrollRef.current = "toolbar-if-below";
                    setStatus(t.key);
                    setPage(1);
                  }}
                >
                  <span className="t-zh">{t.zh}</span>
                  <span className="t-en">{t.en}</span>
                </button>
              ))}
            </div>

            <label className="v3-search">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.8-3.8" />
              </svg>
              <input
                type="search"
                placeholder={lang === "en" ? "Search works…" : "搜索作品…"}
                aria-label={lang === "en" ? "Search works" : "搜索作品"}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </label>

            <div className="segmented-control seg-sm" role="group" aria-label="视图" ref={viewSegRef}>
              <div className="seg-thumb" aria-hidden="true" />
              <button
                type="button"
                className={`seg-btn${view === "wall" ? " is-active" : ""}`}
                aria-label="展墙"
                onClick={() => {
                  pendingScrollRef.current = "toolbar-if-below";
                  setView("wall");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <rect x="1" y="1" width="6" height="6" rx="1" />
                  <rect x="9" y="1" width="6" height="6" rx="1" />
                  <rect x="1" y="9" width="6" height="6" rx="1" />
                  <rect x="9" y="9" width="6" height="6" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                className={`seg-btn${view === "index" ? " is-active" : ""}`}
                aria-label="索引"
                onClick={() => {
                  pendingScrollRef.current = "toolbar-if-below";
                  setView("index");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <rect x="1" y="2" width="14" height="1.6" />
                  <rect x="1" y="7.2" width="14" height="1.6" />
                  <rect x="1" y="12.4" width="14" height="1.6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="container v3-col-body" ref={resultsRef}>
        <div className="v3-col-status" id="col-status-bar">
          {filtered.length ? (
            <>
              <span className="micro-label">
                <span className="t-zh">
                  第 {from}–{to} 件 · 共 {filtered.length} 件
                </span>
                <span className="t-en" lang="en">
                  {from}–{to} of {filtered.length} works
                </span>
              </span>
              <div className="v3-col-status-r">
                <span className="micro-label">
                  <span className="t-zh">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <span className="t-en" lang="en">
                    Page {currentPage} / {totalPages}
                  </span>
                </span>
                {hasFilter ? (
                  <button type="button" className="v3-clear-pill" onClick={resetAll}>
                    <span className="t-zh">清除筛选</span>
                    <span className="t-en">Reset</span> ↺
                  </button>
                ) : null}
              </div>
            </>
          ) : hasFilter ? (
            <>
              <span className="micro-label">
                <span className="t-zh">筛选结果 · 0 件</span>
                <span className="t-en">0 works</span>
              </span>
              <button type="button" className="v3-clear-pill" onClick={resetAll}>
                <span className="t-zh">清除筛选</span>
                <span className="t-en">Reset</span> ↺
              </button>
            </>
          ) : null}
        </div>

        {!filtered.length ? (
          <div className="v3-empty">
            <p>
              <span className="t-zh">没有符合条件的作品。</span>
              <span className="t-en" lang="en">
                No works match your current selection.
              </span>
            </p>
            <button type="button" className="v3-link" onClick={resetAll}>
              <span className="t-zh">清除筛选</span>
              <span className="t-en">Clear filters</span>
              <i aria-hidden="true">↺</i>
            </button>
          </div>
        ) : view === "wall" ? (
          <div className="v3-wall v3-wall-justified">
            {rows.map((row, rIdx) => {
              const cols = [...row.ratios, ...(row.spacer ? [row.spacer] : [])]
                .map((r) => `minmax(0, ${Math.round(r * 1000)}fr)`)
                .join(" ");
              return (
                <div
                  key={`${currentPage}-${rIdx}`}
                  className="v3-jrow"
                  style={{ gridTemplateColumns: cols }}
                >
                  {row.indexes.map((ri, colIdx) => {
                    const a = shown[ri];
                    const globalIdx = indexMap.get(a.slug) ?? ri;
                    const cardSrc = getArtworkCardSrc(a);
                    const facts = getArtworkFacts(a, ["region", "period"]);
                    const tileRatio = row.ratios[colIdx] ?? getArtworkRatio(a);
                    return (
                      <Link
                        key={a.slug}
                        className="tile"
                        href={`/collection/${a.slug}`}
                        data-cursor="view"
                      >
                        <div className="tile-media" style={{ aspectRatio: String(tileRatio) }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cardSrc}
                            alt={a.title.zh}
                            loading={rIdx <= 1 ? "eager" : "lazy"}
                            decoding="async"
                          />
                        </div>
                        <div className="tile-meta">
                          <div className="tile-head">
                            <span className="tile-no">{padNumber(globalIdx + 1)}</span>
                            <h3>
                              <Bi text={a.title} />
                            </h3>
                          </div>
                          <div className="tile-foot">
                            <p>
                              <Bi text={facts} />
                            </p>
                            <StatusPill status={a.status} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="v3-index">
            <div className="v3-index-head">
              <span>No.</span>
              <span>
                <span className="t-zh">作品</span>
                <span className="t-en">Work</span>
              </span>
              <span>
                <span className="t-zh">地区</span>
                <span className="t-en">Region</span>
              </span>
              <span>
                <span className="t-zh">年代</span>
                <span className="t-en">Period</span>
              </span>
              <span>
                <span className="t-zh">材质</span>
                <span className="t-en">Material</span>
              </span>
              <span>
                <span className="t-zh">状态</span>
                <span className="t-en">Status</span>
              </span>
            </div>
            {shown.map((a) => {
              const globalIdx = indexMap.get(a.slug) ?? 0;
              const cardSrc = getArtworkCardSrc(a);
              const facts = getArtworkFacts(a, ["region", "period"]);
              return (
                <Link
                  key={a.slug}
                  className="v3-index-row"
                  href={`/collection/${a.slug}`}
                  data-follow={cardSrc}
                >
                  <span className="ix-no">{padNumber(globalIdx + 1)}</span>
                  <span className="ix-title">
                    <Bi text={a.title} />
                    <small className="ix-sub-mob">
                      <Bi text={facts} />
                    </small>
                  </span>
                  <span>
                    <Bi text={a.region} />
                  </span>
                  <span>
                    <Bi text={a.period} />
                  </span>
                  <span>
                    <Bi text={a.material} />
                  </span>
                  <span>
                    <StatusPill status={a.status} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <nav id="col-pager" className="v3-pagination" aria-label="藏品分页">
            <p className="v3-page-summary">
              <span className="t-zh">
                第 {from} – {to} 件 · 共 {filtered.length} 件作品
              </span>
              <span className="t-en" lang="en">
                {from} – {to} of {filtered.length} works
              </span>
            </p>
            <div className="v3-page-links">
              <button
                type="button"
                className="pg-btn pg-arrow"
                disabled={currentPage === 1}
                aria-label="上一页"
                onClick={() => goPage(currentPage - 1)}
              >
                ←
              </button>
              {pageNumbers.map((item, idx) =>
                typeof item === "number" ? (
                  <button
                    key={item}
                    type="button"
                    className={`pg-btn${item === currentPage ? " is-current" : ""}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    onClick={() => goPage(item)}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={`el-${idx}`} className="pg-ellipsis" aria-hidden="true">
                    …
                  </span>
                ),
              )}
              <button
                type="button"
                className="pg-btn pg-arrow"
                disabled={currentPage === totalPages}
                aria-label="下一页"
                onClick={() => goPage(currentPage + 1)}
              >
                →
              </button>
            </div>
          </nav>
        ) : null}
      </section>
    </>
  );
}
