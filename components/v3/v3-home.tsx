"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { BilingualText } from "@/lib/data/types";
import type { ExhibitionEditorial } from "@/lib/data/exhibition-editorial";
import { padNumber } from "@/lib/v3-helpers";
import { ArrowLink, attachDragScroll, Bi, SectionHead, useV3Reveal, V3Button } from "./v3-ui";

export type V3HomePlate = {
  slug: string;
  title: BilingualText;
  card: string;
  facts: BilingualText;
};

export type V3HomeExhibition = {
  slug: string;
  title: BilingualText;
  periodZh: string;
  venue: BilingualText;
  intro: BilingualText;
  workCount: number;
  pageCount: number;
};

export type V3HomeArticle = {
  slug: string;
  date: string;
  category: BilingualText;
  title: BilingualText;
  cover: string;
};

export type V3HomeProps = {
  totalArtworks: number;
  totalCatalogues: number;
  plates: V3HomePlate[];
  exhibition2026: V3HomeExhibition | null;
  recentWorks: V3HomePlate[];
  chapters: ExhibitionEditorial["chapters"];
  articles: V3HomeArticle[];
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function V3Home({
  totalArtworks,
  totalCatalogues,
  plates,
  exhibition2026,
  recentWorks,
  chapters,
  articles,
}: V3HomeProps) {
  useV3Reveal("home");

  const wrapRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const act1Ref = useRef<HTMLDivElement>(null);
  const act2Ref = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const plinthRef = useRef<HTMLDivElement>(null);
  const colophonHintRef = useRef<HTMLSpanElement>(null);
  const hrailRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const hoveredRef = useRef<number>(-1);
  const [activeCh, setActiveCh] = useState(0);
  const [mobIdx, setMobIdx] = useState(() => (plates.length >= 3 ? 2 : 0));
  const [mobDragX, setMobDragX] = useState(0);
  const [mobDragging, setMobDragging] = useState(false);
  const mobTouchRef = useRef<{
    startX: number;
    startY: number;
    axis: "x" | "y" | null;
    moved: boolean;
  } | null>(null);
  const mobSuppressClickRef = useRef(false);

  const stepMobDeck = (delta: number) => {
    if (!plates.length) return;
    setMobIdx((prev) => (prev + delta + plates.length) % plates.length);
  };

  // Hero 2-zone fan → row (Desktop 5-col / iPad Portrait 3+2 Salon Bloom / Mobile horizontal strip)
  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    const act1 = act1Ref.current;
    const act2 = act2Ref.current;
    const cue = cueRef.current;
    if (!wrap || !stage || !act1 || !act2) return;

    const cards = Array.from(stage.querySelectorAll<HTMLElement>(".fan-card"));
    let wasCompact: boolean | null = null;
    let raf = 0;

    const geo = (t: number, portraitTablet: boolean) => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      if (portraitTablet) {
        const capRoom = 46;
        const gapX = 22;
        const gapY = 24;
        const wFan = Math.max(150, Math.min(W / 3.22, 236));
        const maxRowH = (H - 36 - gapY - capRoom * 2) / 2;
        const wRow = Math.max(140, Math.min((W - gapX * 2) / 3, maxRowH / 1.25, 224));
        const w = lerp(wFan, wRow, t);
        return { H, w, h: w * 1.25, gap: gapX, gapY, capRoom, wRow, hRow: wRow * 1.25 };
      }
      const capRoom = 46;
      const gap = Math.max(14, Math.min(26, W * 0.02));
      const wFanW = Math.min(W / 3.55, 286);
      const wRowW = (W - gap * 4) / 5;
      stage.style.setProperty(
        "--stage-max",
        `${Math.round(Math.max(wFanW * 1.25 * 1.14, wRowW * 1.25 + capRoom + 12))}px`,
      );
      const hAvail = Math.max(110, (H - capRoom) * 0.94);
      const wFan = Math.max(84, Math.min(wFanW, (H * 0.86) / 1.25, 276));
      const wRow = Math.max(84, Math.min(wRowW, hAvail * 0.8, 240));
      const w = lerp(wFan, wRow, t);
      return { H, w, h: w * 1.25, gap, gapY: 0, capRoom, wRow, hRow: wRow * 1.25 };
    };

    const renderHero = () => {
      raf = 0;
      const y = window.scrollY;
      const compact = window.innerWidth < 760 || window.innerHeight < 520;
      const portraitTablet =
        !compact && window.innerWidth <= 1080 && window.innerHeight > window.innerWidth;
      wrap.classList.toggle("is-compact", compact);
      wrap.classList.toggle("is-portrait-tablet", portraitTablet);

      if (compact) {
        if (wasCompact !== true) {
          act1.style.cssText = "";
          act2.style.cssText = "";
          cards.forEach((c) => {
            c.style.transform = "";
          });
        }
        wasCompact = true;
        return;
      }
      wasCompact = false;

      const max = Math.max(1, wrap.offsetHeight - window.innerHeight);
      const p = clamp01((y - wrap.offsetTop) / max);
      const a1 = 1 - clamp01(p / 0.3);
      const a2 = clamp01((p - 0.36) / 0.24);
      act1.style.opacity = a1.toFixed(3);
      act1.style.transform = `translate3d(0,${(-(1 - a1) * 18).toFixed(1)}px,0)`;
      act1.style.pointerEvents = a1 > 0.5 ? "auto" : "none";
      act2.style.opacity = a2.toFixed(3);
      act2.style.transform = `translate3d(0,${((1 - a2) * 16).toFixed(1)}px,0)`;
      act2.style.pointerEvents = a2 > 0.5 ? "auto" : "none";
      if (cue) cue.style.opacity = (1 - clamp01(p / 0.14)).toFixed(2);

      const plinth = plinthRef.current;
      if (plinth && portraitTablet) {
        const po = 1 - clamp01(p / 0.24);
        plinth.style.opacity = po.toFixed(3);
        plinth.style.transform = `translate3d(0,${((1 - po) * 20).toFixed(1)}px,0)`;
        plinth.style.pointerEvents = po > 0.3 ? "auto" : "none";
      }
      const chint = colophonHintRef.current;
      if (chint && portraitTablet) {
        const unfolded = p >= 0.48;
        if (chint.dataset.s !== String(unfolded)) {
          chint.dataset.s = String(unfolded);
          chint.innerHTML = unfolded
            ? `<span class="t-zh">点选任意作品进入观赏室</span><span class="t-en" lang="en">Select any plate to enter</span>`
            : `<span class="t-zh">向上滑动展开五件馆藏 ↓</span><span class="t-en" lang="en">Scroll to unfold five plates ↓</span>`;
        }
      }

      const t = ease(clamp01((p - 0.06) / 0.6));
      const g = geo(t, portraitTablet);
      stage.style.setProperty("--plate-w", `${g.w.toFixed(1)}px`);
      stage.style.setProperty("--plate-h", `${g.h.toFixed(1)}px`);
      const cap = clamp01((t - 0.65) / 0.35);
      const hov = hoveredRef.current;

      cards.forEach((card, idx) => {
        const k = idx - 2;
        let fx: number;
        let fy: number;
        let fr: number;
        let fs: number;
        let rx: number;
        let ry: number;
        if (portraitTablet) {
          fx = k * g.w * 0.5;
          fy = Math.pow(Math.abs(k), 1.5) * g.h * 0.042 - g.H * 0.16;
          fr = k * 5.0;
          fs = k === 0 ? 1 : 0.95;
          const totalH = (g.hRow + g.capRoom) * 2 + g.gapY;
          const ry1 = -totalH / 2 + g.hRow / 2;
          const ry2 = ry1 + g.hRow + g.capRoom + g.gapY;
          const slots: Array<[number, number]> = [
            [-(g.wRow + g.gap) * 0.5, ry2],
            [-(g.wRow + g.gap), ry1],
            [0, ry1],
            [g.wRow + g.gap, ry1],
            [(g.wRow + g.gap) * 0.5, ry2],
          ];
          [rx, ry] = slots[idx] ?? [0, ry1];
        } else {
          fx = k * g.w * 0.6;
          fy = Math.pow(Math.abs(k), 1.5) * g.h * 0.045 - g.h * 0.04;
          fr = k * 5.2;
          fs = k === 0 ? 1 : 0.95;
          rx = k * (g.w + g.gap);
          const lift = Math.min(0, (g.h + g.capRoom) / 2 + 10 - g.H / 2);
          ry = -g.capRoom / 2 + lift;
        }
        let tx = lerp(fx, rx, t);
        let ty = lerp(fy, ry, t);
        let rot = fr * (1 - t);
        let sc = lerp(fs, 1, t);
        if (hov === idx) {
          ty -= t < 0.5 ? g.h * 0.085 : 6;
          rot *= 0.15;
          sc += t < 0.5 ? 0.036 : 0.012;
        } else if (hov !== -1 && t < 0.55) {
          const dist = idx - hov;
          tx += (dist > 0 ? 1 : -1) * Math.max(4, 15 - Math.abs(dist) * 3) * (1 - t);
        }
        card.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        card.style.setProperty("--cap", cap.toFixed(3));
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(renderHero);
    };

    const enterHandlers = cards.map((card, i) => {
      const onEnter = () => {
        hoveredRef.current = i;
        schedule();
      };
      const onLeave = () => {
        hoveredRef.current = -1;
        schedule();
      };
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
      return { card, onEnter, onLeave };
    });

    renderHero();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      enterHandlers.forEach(({ card, onEnter, onLeave }) => {
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("mouseleave", onLeave);
      });
    };
  }, [plates.length]);

  // Horizontal gallery strip drag scroll
  useEffect(() => attachDragScroll(hrailRef.current), []);

  // Sticky chapters scroll tracking (Desktop + iPad >= 760px)
  useEffect(() => {
    if (!chapters.length) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (window.innerWidth < 760) return;
        const mid = window.innerHeight * 0.48;
        let k = 0;
        chapterRefs.current.forEach((el, idx) => {
          if (el && el.getBoundingClientRect().top < mid) k = idx;
        });
        setActiveCh(k);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [chapters.length]);

  return (
    <>
      {/* 1. 2-Zone Fan → Row / 3+2 Salon Hero */}
      <section className="hero-stage-wrap" id="hero-wrap" ref={wrapRef}>
        <div className="hero-sticky">
          <div className="ambient-light" aria-hidden="true">
            <div className="light-orb light-orb-1" />
            <div className="light-orb light-orb-2" />
          </div>

          <div className="hero-copy-zone">
            <div id="hero-act-1" className="hero-act hero-act-1" ref={act1Ref}>
              <p className="hero-eyebrow micro-label">
                <span className="eyebrow-rule" />
                <span>Zhu Jin Ju · Himalayan &amp; Asian Antiquities</span>
                <span className="eyebrow-rule" />
              </p>
              <h1 className="hero-headline">
                <span className="hl-line">
                  <span className="t-zh">在当代光影中，</span>
                  <span className="t-en" lang="en">
                    Timeless devotion,
                  </span>
                </span>
                <span className="hl-line">
                  <span className="t-zh">
                    重遇 <em>Himalayan Art</em>
                  </span>
                  <span className="t-en" lang="en">
                    in <em>living stillness</em>
                  </span>
                </span>
              </h1>
              <p className="hero-sub">
                <span className="t-zh">
                  以学术考据与国际藏家视野，
                  <br className="mob-only-br" />
                  呈现喜马拉雅古代造像、唐卡与法器。
                </span>
                <span className="t-en" lang="en">
                  Himalayan sculpture, thangkas and ritual objects, presented through scholarship
                  and a collector&apos;s eye.
                </span>
              </p>
              <div className="hero-cta">
                <Link className="hero-btn" href="/collection" data-magnetic="0.14">
                  <span className="magnetic-inner">
                    <span className="roll-slot">
                      <span className="roll-a">
                        <span className="t-zh">探索馆藏</span>
                        <span className="t-en">Explore the Collection</span>
                      </span>
                      <span className="roll-b" aria-hidden="true">
                        <span className="t-zh">探索馆藏</span>
                        <span className="t-en">Explore the Collection</span>
                      </span>
                    </span>
                    <span className="hero-btn-arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                </Link>
                <Link className="hero-link" href="/exhibitions">
                  <span className="t-zh">2026 年度特展与图录</span>
                  <span className="t-en">Himalayan Art 2026</span>
                  <span className="hero-link-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </div>
            </div>

            <div id="hero-act-2" className="hero-act hero-act-2" ref={act2Ref}>
              <p className="hero-eyebrow micro-label">
                <span className="eyebrow-rule" />
                <span>Curatorial Philosophy · Chengdu</span>
                <span className="eyebrow-rule" />
              </p>
              <h2 className="hero-manifesto">
                <span className="t-zh">让作品先说话</span>
                <span className="t-en" lang="en">
                  Let the work speak
                </span>
              </h2>
              <p className="hero-manifesto-en">
                <span className="t-zh">Let the work speak for itself</span>
                <span className="t-en">让作品先说话</span>
              </p>
              <ul className="hero-facts">
                <li>
                  <b>{totalArtworks}</b>
                  <span>
                    <span className="t-zh">馆藏研究档案</span>
                    <span className="t-en">Catalogued works</span>
                  </span>
                </li>
                <li>
                  <b>2026</b>
                  <span>
                    <span className="t-zh">嘉德年度特展</span>
                    <span className="t-en">Annual exhibition</span>
                  </span>
                </li>
                <li>
                  <b>{padNumber(totalCatalogues)}</b>
                  <span>
                    <span className="t-zh">年度学术图录</span>
                    <span className="t-en">Published volumes</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="hero-plate-stage" id="hero-plate-stage" ref={stageRef}>
            {plates.map((w, idx) => (
              <Link
                key={w.slug}
                className="fan-card"
                href={`/collection/${w.slug}`}
                data-fan-idx={idx}
                data-cursor="view"
                style={{ zIndex: idx === 2 ? 8 : idx === 1 || idx === 3 ? 6 : 4 }}
              >
                <div className="plate-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.card} alt={w.title.zh} fetchPriority={idx === 2 ? "high" : "auto"} />
                </div>
                <div className="plate-caption">
                  <strong>
                    <Bi text={w.title} />
                  </strong>
                  <span>
                    <Bi text={w.facts} />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Bespoke Mobile Sculptural Fan-Deck Showcase (< 760px only) */}
          {plates.length ? (
            <div className="mob-deck-wrap">
              <div
                className="mob-deck-stage"
                onTouchStart={(e) => {
                  if (e.touches.length !== 1) return;
                  const t = e.touches[0];
                  mobTouchRef.current = {
                    startX: t.clientX,
                    startY: t.clientY,
                    axis: null,
                    moved: false,
                  };
                }}
                onTouchMove={(e) => {
                  const st = mobTouchRef.current;
                  if (!st || e.touches.length !== 1) return;
                  const t = e.touches[0];
                  const dx = t.clientX - st.startX;
                  const dy = t.clientY - st.startY;
                  if (!st.axis && Math.hypot(dx, dy) > 8) {
                    st.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
                  }
                  if (st.axis === "x") {
                    st.moved = true;
                    setMobDragging(true);
                    setMobDragX(Math.max(-130, Math.min(130, dx)));
                  }
                }}
                onTouchEnd={(e) => {
                  const st = mobTouchRef.current;
                  mobTouchRef.current = null;
                  setMobDragging(false);
                  if (!st) return;
                  if (st.moved) {
                    mobSuppressClickRef.current = true;
                    window.setTimeout(() => {
                      mobSuppressClickRef.current = false;
                    }, 320);
                    const t = e.changedTouches[0];
                    const dx = t ? t.clientX - st.startX : 0;
                    setMobDragX(0);
                    if (Math.abs(dx) > 34) {
                      stepMobDeck(dx < 0 ? 1 : -1);
                    }
                  } else {
                    setMobDragX(0);
                  }
                }}
                onTouchCancel={() => {
                  mobTouchRef.current = null;
                  setMobDragging(false);
                  setMobDragX(0);
                }}
              >
                {plates.map((w, idx) => {
                  const n = plates.length;
                  let rel = idx - mobIdx;
                  if (rel > Math.floor(n / 2)) rel -= n;
                  if (rel < -Math.floor(n / 2)) rel += n;
                  const abs = Math.abs(rel);
                  const tx =
                    rel === 0
                      ? mobDragX
                      : abs === 1
                        ? rel * 62 + mobDragX * 0.32
                        : rel * 48 + mobDragX * 0.14;
                  const ty = abs === 0 ? 0 : abs === 1 ? 14 : 26;
                  const sc = abs === 0 ? 1 : abs === 1 ? 0.86 : 0.74;
                  const rot = rel === 0 ? mobDragX * 0.035 : rel * (abs === 1 ? 6.2 : 10.5);
                  const z = abs === 0 ? 10 : abs === 1 ? 6 : 3;
                  const op = abs === 0 ? 1 : abs === 1 ? 0.92 : 0.54;
                  const active = rel === 0;

                  const cardStyle = {
                    transform: `translate3d(${tx.toFixed(1)}px, ${ty}px, 0) rotate(${rot.toFixed(2)}deg) scale(${sc})`,
                    zIndex: z,
                    opacity: op,
                  };

                  return active ? (
                    <Link
                      key={w.slug}
                      href={`/collection/${w.slug}`}
                      className={`mob-deck-card is-active${mobDragging ? " is-dragging" : ""}`}
                      style={cardStyle}
                      onClick={(e) => {
                        if (mobSuppressClickRef.current) e.preventDefault();
                      }}
                    >
                      <div className="mob-deck-frame">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.card} alt={w.title.zh} fetchPriority="high" draggable={false} />
                      </div>
                    </Link>
                  ) : (
                    <button
                      key={w.slug}
                      type="button"
                      className={`mob-deck-card${mobDragging ? " is-dragging" : ""}`}
                      style={cardStyle}
                      aria-label={`查看 ${w.title.zh}`}
                      onClick={() => {
                        if (!mobSuppressClickRef.current) setMobIdx(idx);
                      }}
                    >
                      <div className="mob-deck-frame">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.card} alt={w.title.zh} draggable={false} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const activeWork = plates[mobIdx] ?? plates[0];
                return (
                  <div className="mob-deck-plaque">
                    <div className="mob-deck-meta-row">
                      <span className="mob-deck-counter">
                        <em>{padNumber(mobIdx + 1)}</em> / {padNumber(plates.length)}
                      </span>
                      <i className="mob-deck-rule" aria-hidden="true" />
                      <Link href={`/collection/${activeWork.slug}`} className="mob-deck-enter">
                        <span className="t-zh">进入观赏室</span>
                        <span className="t-en" lang="en">
                          View work
                        </span>{" "}
                        ↗
                      </Link>
                    </div>
                    <h3 className="mob-deck-title">
                      <Link href={`/collection/${activeWork.slug}`}>
                        <Bi text={activeWork.title} />
                      </Link>
                    </h3>
                    <p className="mob-deck-facts">
                      <Bi text={activeWork.facts} />
                    </p>
                  </div>
                );
              })()}

              <div className="mob-deck-dock" role="tablist" aria-label="精选五件馆藏">
                {plates.map((w, idx) => (
                  <button
                    key={w.slug}
                    type="button"
                    role="tab"
                    aria-selected={idx === mobIdx}
                    aria-label={w.title.zh}
                    className={`mob-dock-item${idx === mobIdx ? " is-active" : ""}`}
                    onClick={() => setMobIdx(idx)}
                  >
                    <span className="mob-dock-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={w.card} alt="" draggable={false} />
                    </span>
                    <em>{padNumber(idx + 1)}</em>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div id="scroll-cue" className="hero-scroll-cue" ref={cueRef} aria-hidden="true">
            <span className="t-zh">向下滑动</span>
            <span className="t-en">Scroll</span>
            <i />
          </div>

          <div className="hero-tablet-plinth" id="hero-tablet-plinth" ref={plinthRef}>
            <Link href="/exhibitions">
              <span className="micro-label">01 · ANNUAL EXHIBITION</span>
              <b>
                <span className="t-zh">喜马拉雅艺术 2026</span>
                <span className="t-en">Himalayan Art 2026</span>
              </b>
              <small>
                <span className="t-zh">北京·嘉德艺术中心 · 10.20–25</span>
                <span className="t-en">Guardian Art Center · Oct 20–25</span>
              </small>
            </Link>
            <Link href="/collection">
              <span className="micro-label">02 · ARCHIVE</span>
              <b>
                {totalArtworks} <span className="t-zh">件馆藏研究档案</span>
                <span className="t-en">Catalogued Works</span>
              </b>
              <small>
                <span className="t-zh">古代造像、唐卡、经书与法器</span>
                <span className="t-en">Sculpture, thangkas &amp; ritual craft</span>
              </small>
            </Link>
            <Link href="/contact">
              <span className="micro-label">03 · CHENGDU</span>
              <b>
                <span className="t-zh">竹瑾居艺术空间</span>
                <span className="t-en">Zhu Jin Ju Gallery, Chengdu</span>
              </b>
              <small>
                <span className="t-zh">草堂东路 88 号 · 预约制看件</span>
                <span className="t-en">88 Caotang East Rd · By appointment</span>
              </small>
            </Link>
          </div>

          <div className="hero-tablet-colophon" aria-hidden="true">
            <span>
              <span className="t-zh">竹瑾居艺术空间 · 成都</span>
              <span className="t-en">Zhu Jin Ju Gallery, Chengdu</span>
            </span>
            <span ref={colophonHintRef}>
              <span className="t-zh">向上滑动展开五件馆藏 ↓</span>
              <span className="t-en">Scroll to unfold five plates ↓</span>
            </span>
            <span>
              {totalArtworks} <span className="t-zh">件馆藏档案</span>
              <span className="t-en">Catalogued Works</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Oxblood 2026 Annual Exhibition Band */}
      {exhibition2026 ? (
        <section className="v3-ex26">
          <div className="v3-ex26-glow" aria-hidden="true" />
          <div className="container v3-ex26-grid">
            <div className="v3-ex26-title">
              <p className="micro-label ex-eyebrow-live">
                <i className="dot-spark" aria-hidden="true" />
                ANNUAL EXHIBITION · {exhibition2026.periodZh}
              </p>
              <h2 className="v3-display">
                Himalayan <em>Art 2026</em>
              </h2>
              <p className="v3-ex26-cn">喜 马 拉 雅 艺 术 · 二 〇 二 六</p>
            </div>
            <div className="v3-ex26-vajra">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-parallax="-0.06"
                src="/uploads/artworks/five-pronged-vajra-cover-cutout-2026.png"
                alt="五股金刚杵"
              />
            </div>
            <div className="v3-ex26-copy" data-reveal="">
              <h3>
                <Bi text={exhibition2026.title} />
              </h3>
              <p>
                <Bi text={exhibition2026.intro} />
              </p>
              <dl className="v3-ex26-facts">
                <div>
                  <dt>
                    <span className="t-zh">展出作品</span>
                    <span className="t-en">Works</span>
                  </dt>
                  <dd>
                    <b data-count={exhibition2026.workCount}>{exhibition2026.workCount}</b>
                  </dd>
                </div>
                <div>
                  <dt>
                    <span className="t-zh">电子图版</span>
                    <span className="t-en">Plates</span>
                  </dt>
                  <dd>
                    <b data-count={exhibition2026.pageCount}>{exhibition2026.pageCount}</b>
                  </dd>
                </div>
                <div>
                  <dt>
                    <span className="t-zh">地点</span>
                    <span className="t-en">Venue</span>
                  </dt>
                  <dd>
                    <Bi text={exhibition2026.venue} />
                  </dd>
                </div>
              </dl>
              <div className="v3-btn-row">
                <V3Button
                  href="/exhibitions#catalogue"
                  zh="翻阅电子图录"
                  en="Read the Catalogue"
                  variant="light"
                />
                <ArrowLink href="/exhibitions" zh="展览详情" en="Exhibition" light />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 3. Natural Horizontal Gallery Strip */}
      <section className="v3-gallery-strip">
        <div className="container">
          <SectionHead
            eyebrow="RECENT ACQUISITIONS · 新近入藏"
            zh="馆藏精选"
            en="From the Collection"
            right={
              <div className="v3-strip-actions">
                <div className="v3-step-btns">
                  <button
                    type="button"
                    className="v3-step-btn"
                    aria-label="向左浏览"
                    onClick={() => hrailRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="v3-step-btn"
                    aria-label="向右浏览"
                    onClick={() => hrailRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
                  >
                    →
                  </button>
                </div>
                <ArrowLink
                  href="/collection"
                  zh={`全部 ${totalArtworks} 件`}
                  en={`All ${totalArtworks} works`}
                />
              </div>
            }
          />
        </div>
        <div className="v3-hrail" ref={hrailRef} data-cursor="drag">
          {recentWorks.map((a, i) => (
            <Link
              key={a.slug}
              className="hrail-card"
              href={`/collection/${a.slug}`}
              data-cursor="view"
              draggable={false}
            >
              <div className="tile-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.card} alt={a.title.zh} loading="lazy" draggable={false} />
              </div>
              <div className="hs-meta">
                <span className="tile-no">{padNumber(i + 1)}</span>
                <h3>
                  <Bi text={a.title} />
                </h3>
                <p>
                  <Bi text={a.facts} />
                </p>
              </div>
            </Link>
          ))}
          <Link className="hrail-card hs-more" href="/collection" draggable={false}>
            <span className="t-zh">进入藏品</span>
            <span className="t-en">Enter the Collection</span>
            <i aria-hidden="true">→</i>
          </Link>
        </div>
      </section>

      {/* 4. Sticky Scroll Chapters — Form & Devotion */}
      {chapters.length ? (
        <section className="v3-chapters" id="chapters">
          <div className="container v3-chapters-grid">
            <div className="v3-chapters-sticky">
              <p className="micro-label v3-eyebrow">FORM &amp; DEVOTION · 专题导览</p>
              <div className="ch-touch-tabs" role="tablist" aria-label="章节切换">
                {chapters.map((c, k) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`ch-tab${activeCh === k ? " is-on" : ""}`}
                    onClick={() => {
                      setActiveCh(k);
                      const target = chapterRefs.current[k];
                      if (window.innerWidth >= 760 && target) {
                        window.scrollTo({
                          top: target.getBoundingClientRect().top + window.scrollY - 108,
                          behavior: "smooth",
                        });
                      }
                    }}
                  >
                    <em>{padNumber(k + 1)}</em>
                    <Bi text={c.title} />
                  </button>
                ))}
              </div>
              <div className="v3-chapters-media">
                {chapters.map((c, k) => {
                  const first = c.works[0];
                  return (
                    <figure key={c.id} className={`ch-media${activeCh === k ? " is-on" : ""}`}>
                      {first?.image?.src ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={first.image.src} alt="" loading="lazy" />
                      ) : null}
                      <figcaption>
                        <Bi text={first?.title} />
                      </figcaption>
                    </figure>
                  );
                })}
                <div className="ch-index" aria-hidden="true">
                  <span>{padNumber(activeCh + 1)}</span> / {padNumber(chapters.length)}
                </div>
              </div>
            </div>

            <div className="v3-chapters-text">
              {chapters.map((c, k) => (
                <article
                  key={c.id}
                  ref={(el) => {
                    chapterRefs.current[k] = el;
                  }}
                  className={`ch-block${activeCh === k ? " is-active" : ""}`}
                >
                  <span className="ch-no">{padNumber(k + 1)}</span>
                  <h3 className="v3-h3">
                    <Bi text={c.title} />
                  </h3>
                  <p className="ch-intro" style={{ whiteSpace: "pre-line" }}>
                    {c.introduction}
                  </p>
                  <ul className="ch-works">
                    {c.works.map((w) => (
                      <li key={w.id}>
                        <Link
                          href={w.collectionSlug ? `/collection/${w.collectionSlug}` : "/collection"}
                          data-follow={w.image?.src || ""}
                        >
                          <span>
                            <Bi text={w.title} />
                          </span>
                          <em>
                            <Bi text={w.period} />
                          </em>
                          <i aria-hidden="true">↗</i>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
              <div className="ch-end">
                <ArrowLink
                  href="/journal/form-and-devotion-2026"
                  zh="阅读专题《形有所寄》"
                  en="Read “Form & Devotion”"
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. Home Journal Rows */}
      <section className="v3-journal-home container">
        <SectionHead
          eyebrow="JOURNAL · 文章与动态"
          zh="研究、札记与对谈"
          en="Notes & Conversations"
          right={<ArrowLink href="/journal" zh="全部文章" en="All articles" />}
        />
        <ol className="v3-rows" data-stagger="">
          {articles.map((a) => (
            <li key={a.slug}>
              <Link className="v3-row" href={`/journal/${a.slug}`} data-follow={a.cover}>
                <span className="row-date">{a.date.replace(/-/g, ".")}</span>
                <span className="row-cat">
                  <Bi text={a.category} />
                </span>
                <span className="row-title">
                  <Bi text={a.title} />
                </span>
                {a.cover ? (
                  <span className="row-thumb" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.cover} alt="" loading="lazy" />
                  </span>
                ) : null}
                <i className="row-arrow" aria-hidden="true">
                  →
                </i>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* 6. Chengdu Visit Band */}
      <section className="v3-visit">
        <div className="container v3-visit-grid">
          <div>
            <p className="micro-label v3-eyebrow v3-eyebrow-live">
              <i className="dot-spark" aria-hidden="true" />
              ZHU JIN JU GALLERY · CHENGDU
            </p>
            <h2 className="v3-visit-title">
              <span className="t-zh">在成都，与作品面对面。</span>
              <span className="t-en" lang="en">
                Meet the works in Chengdu.
              </span>
            </h2>
          </div>
          <div className="v3-visit-side" data-reveal="">
            <p>
              <span className="t-zh">
                成都市青羊区草堂东路 88 号。会面采用预约制，可预约看件、研究交流或索取图录。
              </span>
              <span className="t-en" lang="en">
                No. 88 Caotang East Road, Chengdu. Viewings, research visits and catalogue requests
                by appointment.
              </span>
            </p>
            <div className="v3-btn-row">
              <V3Button href="/contact" zh="预约到访" en="Book a visit" />
              <ArrowLink href="/about" zh="关于竹瑾居" en="About us" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
