"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HistoryBackLink } from "@/components/history-back-link";
import { catalogueImageVariant } from "@/lib/catalogue-media";
import type { ArtworkCatalogueReference } from "@/lib/data/catalogue-pages";
import type { Artwork } from "@/lib/data/types";
import { withImageVersion } from "@/lib/image-url";
import {
  extractYear,
  getArtworkCardSrc,
  getArtworkDetailPhotos,
  getArtworkFacts,
  padNumber,
  splitParagraphs,
} from "@/lib/v3-helpers";
import { useV3 } from "./v3-shell";
import { attachDragScroll, Bi, SectionHead, StatusPill, useV3Reveal } from "./v3-ui";

type StageMode = "darkroom" | "daylight" | "compare";

export function V3ArtworkDetail({
  artwork,
  index,
  total,
  prevArtwork,
  nextArtwork,
  relatedWorks,
  catalogue,
}: {
  artwork: Artwork;
  index: number;
  total: number;
  prevArtwork: Artwork;
  nextArtwork: Artwork;
  relatedWorks: Artwork[];
  catalogue?: ArtworkCatalogueReference;
}) {
  const { lang, toast, openInquiry, openLightbox, setDarkHero } = useV3();
  useV3Reveal(`work-${artwork.slug}`);

  useEffect(() => {
    setDarkHero(false);
  }, [setDarkHero]);

  const photos = useMemo(() => getArtworkDetailPhotos(artwork), [artwork]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [mode, setMode] = useState<StageMode>("darkroom");
  const [split, setSplit] = useState(50);
  const [lensOn, setLensOn] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [selectedReqs, setSelectedReqs] = useState<string[]>([]);
  const [essayOpen, setEssayOpen] = useState(false);

  const segRef = useRef<HTMLDivElement>(null);
  const segThumbRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageImgRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const cmpRef = useRef<HTMLDivElement>(null);
  const cmpDragRef = useRef(false);
  const touchXRef = useRef<number | null>(null);
  const essayRef = useRef<HTMLDivElement>(null);
  const essayBarRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Reset local interactive state when navigating to a different artwork
  useEffect(() => {
    setPhotoIdx(0);
    setMode("darkroom");
    setSplit(50);
    setLensOn(false);
    setSelectedReqs([]);
    setEssayOpen(false);
  }, [artwork.slug]);

  // Finite neighbour-only photo preloading
  useEffect(() => {
    [photoIdx - 1, photoIdx + 1, photoIdx + 2].forEach((idx) => {
      if (idx >= 0 && idx < photos.length && idx !== photoIdx) {
        const im = new Image();
        im.src = photos[idx];
      }
    });
  }, [photoIdx, photos]);

  // Mark image loaded immediately if cached
  useEffect(() => {
    setImgLoaded(Boolean(stageImgRef.current?.complete));
  }, [photoIdx, mode]);

  // Sync segmented control thumb
  const syncSeg = useCallback((instant = false) => {
    const wrap = segRef.current;
    const thumb = segThumbRef.current;
    if (!wrap || !thumb) return;
    const active = wrap.querySelector<HTMLElement>(".seg-btn.is-active");
    if (!active) {
      thumb.style.opacity = "0";
      return;
    }
    const cr = wrap.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    if (!ar.width) return;
    if (instant) thumb.style.transition = "none";
    thumb.style.opacity = "1";
    thumb.style.width = `${ar.width}px`;
    thumb.style.transform = `translateX(${ar.left - cr.left + wrap.scrollLeft}px)`;
    if (instant) {
      void thumb.offsetWidth;
      thumb.style.transition = "";
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => syncSeg(false));
    const onResize = () => syncSeg(true);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [mode, lang, syncSeg]);

  const stepPhoto = useCallback(
    (delta: number) => {
      if (photos.length <= 1) return;
      setPhotoIdx((prev) => (prev + delta + photos.length) % photos.length);
      setMode((prev) => (prev === "compare" ? "darkroom" : prev));
    },
    [photos.length],
  );

  // Keyboard arrow stepping
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.matches?.("input,textarea,select")) return;
      if (e.key === "ArrowRight") stepPhoto(1);
      else if (e.key === "ArrowLeft") stepPhoto(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepPhoto]);

  // Compare intro sweep animation
  useEffect(() => {
    if (mode !== "compare") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let t0: number | null = null;
    const sweep = (now: number) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, Math.max(0, (now - t0) / 1400));
      if (!cmpDragRef.current) {
        setSplit(50 + Math.sin(t * Math.PI * 2) * 18 * (1 - t));
      }
      if (t < 1 && !cmpDragRef.current) {
        raf = requestAnimationFrame(sweep);
      }
    };
    raf = requestAnimationFrame(sweep);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // Vertical essay reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const essay = essayRef.current;
      const bar = essayBarRef.current;
      if (!essay || !bar) return;
      const r = essay.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(0, (window.innerHeight * 0.6 - r.top) / Math.max(1, r.height)),
      );
      bar.style.transform = `scaleY(${progress.toFixed(3)})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [essayOpen, artwork.slug]);

  // Draggable inertia rail for related works
  useEffect(() => attachDragScroll(railRef.current), [artwork.slug]);

  const currentSrc = photos[photoIdx] || photos[0] || "";

  // Desktop 2.4x loupe movement
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!lensOn || mode === "compare") return;
    const img = stageImgRef.current;
    const wrap = canvasRef.current;
    const lens = lensRef.current;
    if (!img || !wrap || !lens) return;
    const r = img.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const size = 186;
    const zoom = 2.4;
    if (x < 0 || y < 0 || x > r.width || y > r.height) {
      lens.classList.remove("is-on");
      return;
    }
    lens.classList.add("is-on");
    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    lens.style.backgroundSize = `${r.width * zoom}px ${r.height * zoom}px`;
    lens.style.backgroundPosition = `${-(x * zoom - size / 2)}px ${-(y * zoom - size / 2)}px`;
    lens.style.transform = `translate3d(${(e.clientX - w.left - size / 2).toFixed(1)}px, ${(e.clientY - w.top - size / 2).toFixed(1)}px, 0)`;
  };

  const handleCanvasMouseLeave = () => {
    lensRef.current?.classList.remove("is-on");
  };

  const toggleLens = () => {
    let nextOn = !lensOn;
    if (mode === "compare") {
      setMode("darkroom");
      nextOn = true;
    }
    setLensOn(nextOn);
    if (!nextOn) lensRef.current?.classList.remove("is-on");
    toast(
      nextOn
        ? lang === "en"
          ? "Loupe on — move cursor over artwork"
          : "放大镜已开启：移动鼠标细看局部"
        : lang === "en"
          ? "Loupe off"
          : "放大镜已关闭",
    );
  };

  const updateCompareSplit = (clientX: number) => {
    const cmp = cmpRef.current;
    if (!cmp) return;
    const r = cmp.getBoundingClientRect();
    const next = Math.max(3, Math.min(97, ((clientX - r.left) / r.width) * 100));
    setSplit(next);
  };

  const supportOptions = useMemo(
    () =>
      artwork.inquirySupport?.length
        ? artwork.inquirySupport
        : [
            { zh: "高清局部图", en: "High-res details" },
            { zh: "品相报告", en: "Condition report" },
            { zh: "图录页", en: "Catalogue pages" },
          ],
    [artwork.inquirySupport],
  );

  const toggleReq = (key: string) => {
    setSelectedReqs((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const specs = useMemo(() => {
    const items: Array<{ zh: string; en: string; val: Artwork["period"] }> = [
      { zh: "年代", en: "Period", val: artwork.period },
      { zh: "地区", en: "Region", val: artwork.region },
      { zh: "产地", en: "Origin", val: artwork.origin },
      { zh: "材质", en: "Material", val: artwork.material },
      { zh: "尺寸", en: "Dimensions", val: artwork.dimensions },
      { zh: "类别", en: "Category", val: artwork.category },
    ];
    return items.filter(
      (item) =>
        item.val &&
        (item.val.zh?.trim() || item.val.en?.trim()) &&
        !(item.en === "Origin" && item.val.zh === artwork.region?.zh),
    );
  }, [artwork]);

  const zhParas = useMemo(() => splitParagraphs(artwork.viewingNote?.zh), [artwork.viewingNote?.zh]);
  const enParas = useMemo(() => splitParagraphs(artwork.viewingNote?.en), [artwork.viewingNote?.en]);
  const cmpZh = useMemo(() => splitParagraphs(artwork.comparisonNote?.zh), [artwork.comparisonNote?.zh]);
  const cmpEn = useMemo(() => splitParagraphs(artwork.comparisonNote?.en), [artwork.comparisonNote?.en]);
  const isLongNote =
    zhParas.length > 2 || zhParas.join("").length > 220 || cmpZh.length > 0;

  const archivalColumns = useMemo(() => {
    const prov = (artwork.provenance ?? []).filter((p) => p.label?.zh || p.label?.en);
    const exhs = (artwork.exhibitions ?? []).filter((e) => e.title?.zh || e.title?.en);
    const pubs = (artwork.publications ?? []).filter((p) => p.title?.zh || p.title?.en);
    const cols: Array<{
      key: string;
      zh: string;
      en: string;
      entries: Array<{ zh: string; en: string }>;
    }> = [];
    if (prov.length) {
      cols.push({
        key: "prov",
        zh: "来源",
        en: "Provenance",
        entries: prov.map((p) => ({
          zh: [p.label.zh || p.label.en, p.note?.zh].filter(Boolean).join("，"),
          en: [p.label.en || p.label.zh, p.note?.en || p.note?.zh].filter(Boolean).join(", "),
        })),
      });
    }
    if (exhs.length) {
      cols.push({
        key: "exhs",
        zh: "展览",
        en: "Exhibited",
        entries: exhs.map((e) => ({
          zh: [e.title.zh || e.title.en, e.venue?.zh, e.year].filter(Boolean).join("，"),
          en: [e.title.en || e.title.zh, e.venue?.en || e.venue?.zh, e.year]
            .filter(Boolean)
            .join(", "),
        })),
      });
    }
    if (pubs.length) {
      cols.push({
        key: "pubs",
        zh: "出版",
        en: "Literature",
        entries: pubs.map((p) => ({
          zh: [p.title.zh || p.title.en, p.year, p.pages?.zh, p.note?.zh]
            .filter(Boolean)
            .join("，"),
          en: [
            p.title.en || p.title.zh,
            p.year,
            p.pages?.en || p.pages?.zh,
            p.note?.en || p.note?.zh,
          ]
            .filter(Boolean)
            .join(", "),
        })),
      });
    }
    return cols;
  }, [artwork.exhibitions, artwork.provenance, artwork.publications]);

  const totalRecords = archivalColumns.reduce((sum, c) => sum + c.entries.length, 0);

  const catYear = catalogue
    ? extractYear(catalogue.title.zh) || extractYear(catalogue.title.en) || "2026"
    : "";
  const catPageLabel = catalogue
    ? catalogue.pages[0] === catalogue.pages[1]
      ? { zh: `第 ${catalogue.pages[0]} 页`, en: `p. ${catalogue.pages[0]}` }
      : {
          zh: `第 ${catalogue.pages[0]}–${catalogue.pages[1]} 页`,
          en: `pp. ${catalogue.pages[0]}–${catalogue.pages[1]}`,
        }
    : null;

  const primaryTitle = lang === "en" ? artwork.title.en || artwork.title.zh : artwork.title.zh;
  const secondaryTitle = lang === "en" ? artwork.title.zh : artwork.title.en;

  const prevCard = getArtworkCardSrc(prevArtwork);
  const nextCard = getArtworkCardSrc(nextArtwork);

  return (
    <>
      <section className="v3-work" id="work">
        <div
          className={`v3-work-stage is-${mode === "daylight" ? "daylight" : "darkroom"}`}
          id="stage"
        >
          <div className="stage-bar">
            <span className="micro-label stage-count">
              PLATE <b>{padNumber(photoIdx + 1)}</b> / {padNumber(photos.length)}
            </span>
            <div ref={segRef} className="segmented-control stage-seg" role="group" aria-label="观看方式">
              <div ref={segThumbRef} className="seg-thumb" aria-hidden="true" />
              {(
                [
                  ["darkroom", "暗房", "Dark"],
                  ["daylight", "日间", "Day"],
                  ["compare", "对比", "Compare"],
                ] as const
              ).map(([k, zh, en]) => (
                <button
                  key={k}
                  type="button"
                  className={`seg-btn${mode === k ? " is-active" : ""}`}
                  onClick={() => {
                    setMode(k);
                    if (k === "compare") {
                      setLensOn(false);
                      lensRef.current?.classList.remove("is-on");
                    }
                  }}
                >
                  <span className="t-zh">{zh}</span>
                  <span className="t-en" lang="en">
                    {en}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`stage-tool${lensOn ? " is-on" : ""}`}
              aria-pressed={lensOn}
              onClick={toggleLens}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m20 20-4-4M11 8.5v5M8.5 11h5" />
              </svg>
              <span className="t-zh">放大镜</span>
              <span className="t-en" lang="en">
                Loupe
              </span>
            </button>
          </div>

          <div
            ref={canvasRef}
            className={`stage-canvas${lensOn && mode !== "compare" ? " lens-on" : ""}`}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            onTouchStart={(e) => {
              if (mode !== "compare") touchXRef.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchXRef.current === null || mode === "compare") return;
              const dx = e.changedTouches[0].clientX - touchXRef.current;
              if (Math.abs(dx) > 42) stepPhoto(dx < 0 ? 1 : -1);
              touchXRef.current = null;
            }}
          >
            {mode === "compare" ? (
              <div
                ref={cmpRef}
                className="compare-slider"
                style={{ ["--split" as string]: `${split.toFixed(1)}%` }}
                data-cursor="drag"
                onPointerDown={(e) => {
                  cmpDragRef.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  updateCompareSplit(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (cmpDragRef.current) updateCompareSplit(e.clientX);
                }}
                onPointerUp={() => {
                  cmpDragRef.current = false;
                }}
                onPointerCancel={() => {
                  cmpDragRef.current = false;
                }}
              >
                <div className="compare-layer compare-layer-base">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentSrc} alt={artwork.title.zh} />
                </div>
                <div className="compare-layer compare-layer-top">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentSrc} alt="" aria-hidden="true" />
                </div>
                <span className="compare-tag compare-tag-left">
                  <span className="t-zh">日间光</span>
                  <span className="t-en" lang="en">
                    Daylight
                  </span>
                </span>
                <span className="compare-tag compare-tag-right">
                  <span className="t-zh">暗房光</span>
                  <span className="t-en" lang="en">
                    Darkroom
                  </span>
                </span>
                <div className="compare-divider">
                  <div className="compare-handle">⇄</div>
                </div>
              </div>
            ) : (
              <>
                {photos.length > 1 ? (
                  <button
                    type="button"
                    className="stage-nav stage-prev"
                    aria-label="上一张图版"
                    onClick={() => stepPhoto(-1)}
                  >
                    ←
                  </button>
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={stageImgRef}
                  className={`stage-img${imgLoaded ? " is-loaded" : ""}`}
                  src={currentSrc}
                  alt={artwork.title.zh}
                  data-cursor="view"
                  onLoad={() => setImgLoaded(true)}
                  onClick={() => {
                    if (!lensOn) {
                      openLightbox(photos, photoIdx, artwork.title.zh, artwork.title.en);
                    }
                  }}
                />
                {photos.length > 1 ? (
                  <button
                    type="button"
                    className="stage-nav stage-next"
                    aria-label="下一张图版"
                    onClick={() => stepPhoto(1)}
                  >
                    →
                  </button>
                ) : null}
                <div ref={lensRef} className="lens" aria-hidden="true" />
              </>
            )}
          </div>

          <div className="stage-thumbs">
            {photos.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                className={`stage-thumb${i === photoIdx ? " is-active" : ""}`}
                aria-label={`图 ${i + 1}`}
                onClick={() => {
                  setPhotoIdx(i);
                  if (mode === "compare") setMode("darkroom");
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
            <button
              type="button"
              className="stage-tool"
              onClick={() => openLightbox(photos, photoIdx, artwork.title.zh, artwork.title.en)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
              <span className="t-zh">全屏</span>
              <span className="t-en" lang="en">
                Full
              </span>
            </button>
          </div>
        </div>

        <aside className="v3-work-dossier">
          <div className="dossier-top">
            <HistoryBackLink fallbackHref="/collection" className="v3-crumb">
              ← <span className="t-zh">藏品</span>
              <span className="t-en" lang="en">
                Collection
              </span>
            </HistoryBackLink>
            <div className="dossier-nav">
              <Link
                href={`/collection/${prevArtwork.slug}`}
                aria-label="上一件"
                data-follow={prevCard}
              >
                ←
              </Link>
              <span>
                {padNumber(index + 1)} / {total}
              </span>
              <Link
                href={`/collection/${nextArtwork.slug}`}
                aria-label="下一件"
                data-follow={nextCard}
              >
                →
              </Link>
            </div>
          </div>

          <p className="micro-label v3-eyebrow">
            <Bi text={artwork.category} /> · No. {padNumber(index + 1)}
          </p>
          <h1 className="v3-work-title">{primaryTitle}</h1>
          {secondaryTitle && secondaryTitle !== primaryTitle ? (
            <p className="v3-work-en" lang={lang === "en" ? "zh" : "en"}>
              {secondaryTitle}
            </p>
          ) : null}

          <dl className="v3-spec">
            {specs.map((item) => (
              <div key={item.en} className="spec-line">
                <dt>
                  <span className="t-zh">{item.zh}</span>
                  <span className="t-en" lang="en">
                    {item.en}
                  </span>
                </dt>
                <dd>
                  <Bi text={item.val} />
                </dd>
              </div>
            ))}
            <div className="spec-line">
              <dt>
                <span className="t-zh">状态</span>
                <span className="t-en" lang="en">
                  Status
                </span>
              </dt>
              <dd>
                <StatusPill status={artwork.status} />
              </dd>
            </div>
          </dl>

          {artwork.status !== "sold" ? (
            <>
              <p className="micro-label v3-chip-label">
                <span className="t-zh">需要的资料（可多选）</span>
                <span className="t-en" lang="en">
                  Request materials
                </span>
              </p>
              <div className="v3-chips">
                {supportOptions.map((opt) => {
                  const key = opt.zh || opt.en;
                  const on = selectedReqs.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`v3-chip${on ? " is-on" : ""}`}
                      onClick={() => toggleReq(key)}
                    >
                      <i aria-hidden="true" />
                      <Bi text={opt} />
                    </button>
                  );
                })}
              </div>
              <div className="v3-btn-row">
                <button
                  type="button"
                  className="v3-btn v3-btn-dark"
                  data-magnetic="0.12"
                  onClick={() => openInquiry({ slug: artwork.slug, requests: selectedReqs })}
                >
                  <span className="v3-btn-text">
                    <span className="roll-slot">
                      <span className="roll-a">
                        <span className="t-zh">洽询此作</span>
                        <span className="t-en" lang="en">
                          Inquire
                        </span>
                      </span>
                      <span className="roll-b" aria-hidden="true">
                        <span className="t-zh">洽询此作</span>
                        <span className="t-en">Inquire</span>
                      </span>
                    </span>
                    <i aria-hidden="true">→</i>
                  </span>
                </button>
                <Link className="v3-link" href={`/contact?work=${artwork.slug}#inquiry`}>
                  <span className="t-zh">到联系页留言</span>
                  <span className="t-en" lang="en">
                    Contact page
                  </span>
                  <i aria-hidden="true">→</i>
                </Link>
              </div>
            </>
          ) : (
            <p className="v3-sold-note">
              <span className="t-zh">此件已洽购。欢迎就同类作品与研究进行交流。</span>
              <span className="t-en" lang="en">
                This work has been acquired. We welcome related research enquiries.
              </span>
            </p>
          )}

          {catalogue && catPageLabel ? (
            <a
              className="v3-dossier-catlink"
              href="#in-catalogue"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("in-catalogue")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <i className="dot-spark" aria-hidden="true" />
              <span>
                <span className="t-zh">收录于 {catYear} 展览图录</span>
                <span className="t-en" lang="en">
                  {catYear} Exhibition Catalogue
                </span>{" "}
                · <Bi text={catPageLabel} />
              </span>
              <em>
                <span className="t-zh">查看图录当页 ↓</span>
                <span className="t-en" lang="en">
                  View spread ↓
                </span>
              </em>
            </a>
          ) : null}
        </aside>
      </section>

      {zhParas.length || enParas.length || cmpZh.length || cmpEn.length ? (
        <section className="v3-essay container">
          <div className="v3-essay-side">
            <p className="micro-label v3-eyebrow">
              <span className="t-zh">观看笔记</span>
              <span className="t-en" lang="en">
                Viewing Note
              </span>
            </p>
            {isLongNote ? (
              <p className="v3-essay-meta">
                <span className="t-zh">共 {zhParas.length} 段赏析</span>
                <span className="t-en" lang="en">
                  {enParas.length || zhParas.length} paragraphs
                </span>
              </p>
            ) : null}
            <div className="v3-essay-progress">
              <i ref={essayBarRef} />
            </div>
          </div>
          <div className="v3-essay-col">
            <div
              ref={essayRef}
              className={`v3-essay-body${isLongNote && !essayOpen ? " is-folded" : ""}`}
            >
              <div className="t-zh">
                {zhParas.map((p, i) => (
                  <p key={i} className={i === 0 ? "is-lead" : undefined}>
                    {p}
                  </p>
                ))}
              </div>
              <div className="t-en" lang="en">
                {(enParas.length ? enParas : zhParas).map((p, i) => (
                  <p key={i} className={i === 0 ? "is-lead" : undefined}>
                    {p}
                  </p>
                ))}
              </div>
              {cmpZh.length || cmpEn.length ? (
                <>
                  <h3 className="v3-h4">
                    <span className="t-zh">比较与参照</span>
                    <span className="t-en" lang="en">
                      Comparisons
                    </span>
                  </h3>
                  <div className="t-zh">
                    {cmpZh.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  <div className="t-en" lang="en">
                    {(cmpEn.length ? cmpEn : cmpZh).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            {isLongNote ? (
              <div className="v3-essay-actions">
                <button
                  type="button"
                  className={`v3-essay-toggle${essayOpen ? " is-open" : ""}`}
                  aria-expanded={essayOpen}
                  onClick={() => setEssayOpen((prev) => !prev)}
                >
                  {essayOpen ? (
                    <>
                      <span className="t-zh">收起全文</span>
                      <span className="t-en" lang="en">
                        Collapse
                      </span>
                      <i aria-hidden="true">↑</i>
                    </>
                  ) : (
                    <>
                      <span className="t-zh">展开全文</span>
                      <span className="t-en" lang="en">
                        Read in full
                      </span>
                      <i aria-hidden="true">↓</i>
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {catalogue && catPageLabel ? (
        <section className="v3-cat-band" id="in-catalogue">
          <div className="container v3-cat-band-grid">
            <div className="v3-cat-band-copy">
              <p className="micro-label v3-cat-band-eyebrow">
                <span className="t-zh">图录中的这件作品</span>
                <em lang="en">IN THE CATALOGUE</em>
              </p>
              <h2 className="v3-cat-band-title">
                {lang === "en" ? catalogue.title.en || catalogue.title.zh : catalogue.title.zh}
              </h2>
              {lang === "zh" && catalogue.title.en ? (
                <p className="v3-cat-band-en" lang="en">
                  {catalogue.title.en}
                </p>
              ) : null}
              <p className="v3-cat-band-pages">
                {lang === "en" ? catPageLabel.en : `${catPageLabel.zh} · ${catPageLabel.en}`}
              </p>
              <Link className="v3-cat-band-link" href={catalogue.href}>
                <span>
                  <span className="t-zh">翻到此页阅读</span>
                  <em lang="en">Open at this page</em>
                </span>
                <i aria-hidden="true">→</i>
              </Link>
            </div>
            <Link
              className={`v3-cat-band-spread${catalogue.images.length === 2 ? " is-paired" : ""}`}
              href={catalogue.href}
              data-cursor="view"
              aria-label="翻到此页阅读"
            >
              {catalogue.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${img}-${i}`}
                  src={withImageVersion(catalogueImageVariant(img, "reader"))}
                  alt={i === 0 ? catalogue.title.zh : ""}
                  loading="lazy"
                />
              ))}
            </Link>
          </div>
        </section>
      ) : null}

      {archivalColumns.length ? (
        <section className="container v3-records-wrap">
          <div className="v3-dossier-records" data-reveal="">
            <div className="records-banner">
              <p className="micro-label records-eyebrow">
                <i className="dot-spark" aria-hidden="true" />
                ARCHIVAL RECORD · <span className="t-zh">来源、展览与出版著录</span>
                <span className="t-en" lang="en">
                  Provenance, Exhibitions &amp; Literature
                </span>
              </p>
              <span className="records-summary">
                {totalRecords} <span className="t-zh">项著录</span>
                <span className="t-en" lang="en">
                  entries
                </span>
              </span>
            </div>
            <div className="v3-records" data-cols={archivalColumns.length}>
              {archivalColumns.map((col, ci) => (
                <div key={col.key} className="v3-record">
                  <div className="rec-head">
                    <span className="rec-no">{padNumber(ci + 1)}</span>
                    <h3>
                      <span className="rec-zh">{col.zh}</span>
                      <span className="rec-en" lang="en">
                        {col.en}
                      </span>
                    </h3>
                    <span className="rec-count">{padNumber(col.entries.length)}</span>
                  </div>
                  <ul>
                    {col.entries.map((entry, ei) => (
                      <li key={ei}>
                        <i className="rec-dot" aria-hidden="true" />
                        <span>
                          <Bi text={entry} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {relatedWorks.length ? (
        <section className="v3-related">
          <div className="container">
            <SectionHead
              eyebrow="RELATED WORKS · 相关作品"
              zh="延伸观看"
              en="Further Looking"
              right={
                <span className="v3-drag-hint micro-label">
                  <span className="t-zh">拖动浏览</span>
                  <span className="t-en" lang="en">
                    Drag
                  </span>{" "}
                  ⇠ ⇢
                </span>
              }
            />
          </div>
          <div ref={railRef} className="v3-rail" data-cursor="drag">
            {relatedWorks.map((item) => (
              <Link
                key={item.slug}
                className="rail-card"
                href={`/collection/${item.slug}`}
                draggable={false}
              >
                <div className="tile-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getArtworkCardSrc(item)}
                    alt={item.title.zh}
                    loading="lazy"
                    draggable={false}
                  />
                </div>
                <h3>
                  <Bi text={item.title} />
                </h3>
                <p>
                  <Bi text={getArtworkFacts(item)} />
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Link className="v3-next" href={`/collection/${nextArtwork.slug}`}>
        <div className="container v3-next-inner">
          <div>
            <p className="micro-label">
              <span className="t-zh">下一件</span>
              <span className="t-en" lang="en">
                Next work
              </span>{" "}
              · {padNumber(((index + 1) % total) + 1)}
            </p>
            <h2>
              <Bi text={nextArtwork.title} />
            </h2>
            <p>
              <Bi text={getArtworkFacts(nextArtwork, ["region", "period", "material"])} />
            </p>
          </div>
          <div className="v3-next-img tile-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nextCard} alt="" loading="lazy" />
          </div>
        </div>
      </Link>
    </>
  );
}
