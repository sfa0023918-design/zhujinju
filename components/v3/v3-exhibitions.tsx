"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { HistoryBackLink } from "@/components/history-back-link";
import type { Exhibition } from "@/lib/data/types";
import { withImageVersion } from "@/lib/image-url";
import {
  exhibitionHref,
  extractYear,
  isFlagshipExhibition,
  splitParagraphs,
} from "@/lib/v3-helpers";
import { V3InlineCatalogue } from "./v3-inline-catalogue";
import { useV3 } from "./v3-shell";
import { ArrowLink, Bi, SectionHead, useV3Reveal, V3Button } from "./v3-ui";

function resolveExhibitionCover(exhibition: Exhibition): string {
  const raw =
    exhibition.coverAsset?.hero ||
    exhibition.coverAsset?.detail ||
    exhibition.coverAsset?.card ||
    exhibition.coverAsset?.original ||
    exhibition.cover ||
    "";
  return raw ? withImageVersion(raw) : "";
}

function PrefaceSection({ exhibition }: { exhibition: Exhibition }) {
  const [open, setOpen] = useState(false);

  const zh = useMemo(
    () => (exhibition.description ?? []).flatMap((d) => splitParagraphs(d?.zh)),
    [exhibition.description],
  );
  const en = useMemo(
    () => (exhibition.description ?? []).flatMap((d) => splitParagraphs(d?.en)),
    [exhibition.description],
  );

  if (!zh.length) return null;
  const collapsible = zh.length > 5;

  return (
    <section className="v3-preface container" id="preface">
      <div className="v3-preface-side">
        <p className="micro-label v3-eyebrow">
          <span className="t-zh">序言</span>
          <span className="t-en" lang="en">
            Preface
          </span>
        </p>
        <h2 className="v3-h2">
          <span className="t-zh">序</span>
          <span className="t-en" lang="en">
            Preface
          </span>
        </h2>
      </div>
      <div className="v3-preface-body">
        <p className="v3-preface-lead t-zh">{zh[0]}</p>
        <p className="v3-preface-lead t-en" lang="en">
          {en[0] || zh[0]}
        </p>
        <div className={`v3-preface-rest${collapsible && !open ? " is-folded" : ""}`}>
          <div className="t-zh">
            {zh.slice(1).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="t-en" lang="en">
            {(en.length ? en : zh).slice(1).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        {collapsible ? (
          <button
            type="button"
            className="v3-link"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? (
              <>
                <span className="t-zh">收起</span>
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
        ) : null}
      </div>
    </section>
  );
}

function ArchiveGallery({
  list,
  allExhibitions,
  eyebrow,
  zhTitle,
  enTitle,
}: {
  list: Exhibition[];
  allExhibitions: Exhibition[];
  eyebrow: string;
  zhTitle: string;
  enTitle: string;
}) {
  if (!list.length) return null;

  return (
    <section className="container v3-archive">
      <SectionHead
        eyebrow={eyebrow}
        zh={zhTitle}
        en={enTitle}
        right={<ArrowLink href="/collection" zh="浏览全部藏品" en="Browse Collection" />}
      />
      <div className="v3-archive-grid" data-stagger="">
        {list.map((ex, idx) => {
          const href = exhibitionHref(ex, allExhibitions);
          const catHref = `${href}#catalogue`;
          const pageCount = ex.cataloguePageImages?.length || ex.cataloguePages || 0;
          const flagship = isFlagshipExhibition(ex, allExhibitions);
          return (
            <article
              key={ex.slug}
              className="ex-archive-card"
              data-reveal=""
              style={{ ["--d" as string]: `${idx * 70}ms` }}
            >
              <Link className="ex-archive-cover" href={href} data-cursor="view">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolveExhibitionCover(ex)} alt={ex.title.zh} loading="lazy" />
              </Link>
              <div className="ex-archive-body">
                <div className="ex-archive-meta">
                  <span className="ex-archive-year">
                    {flagship ? <i className="dot-spark" aria-hidden="true" /> : null}
                    {extractYear(ex.period.zh)}
                  </span>
                  <span className="ex-archive-pages">
                    {pageCount} <span className="t-zh">页电子图录</span>
                    <span className="t-en" lang="en">
                      pp. catalogue
                    </span>
                  </span>
                </div>
                <h3 className="ex-archive-title">
                  <Link href={href}>
                    <Bi text={ex.title} />
                  </Link>
                </h3>
                <p className="ex-archive-sub">
                  <Bi text={ex.venue} /> · {ex.period.zh}
                </p>
                <p className="ex-archive-intro">
                  <Bi text={ex.catalogueIntro?.zh ? ex.catalogueIntro : ex.intro} />
                </p>
                <div className="ex-archive-actions">
                  <Link className="v3-link" href={href}>
                    <span className="t-zh">展览详情</span>
                    <span className="t-en" lang="en">
                      Exhibition
                    </span>
                    <i aria-hidden="true">→</i>
                  </Link>
                  <Link className="ex-archive-catbtn" href={catHref}>
                    <span className="t-zh">翻阅图录</span>
                    <span className="t-en" lang="en">
                      Catalogue
                    </span>
                    <i aria-hidden="true">↗</i>
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function V3FlagshipExhibition({
  exhibition,
  pastExhibitions,
  allExhibitions,
  worksCount,
}: {
  exhibition: Exhibition;
  pastExhibitions: Exhibition[];
  allExhibitions: Exhibition[];
  worksCount: number;
}) {
  const { setDarkHero } = useV3();
  const [fullSignal, setFullSignal] = useState(0);
  const vajraRef = useRef<HTMLImageElement>(null);

  useV3Reveal(`ex-flagship-${exhibition.slug}`);

  useEffect(() => {
    setDarkHero(true);
    return () => setDarkHero(false);
  }, [setDarkHero]);

  // Subtle vertical parallax on the 2026 cutout Vajra
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = vajraRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - window.innerHeight / 2) * -0.06;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const year = extractYear(exhibition.period.zh) || "2026";
  const pageCount = exhibition.cataloguePageImages?.length || exhibition.cataloguePages || 0;

  return (
    <>
      <section className="v3-ex-hero">
        <div className="v3-ex26-glow" aria-hidden="true" />
        <div className="container v3-ex-hero-grid">
          <div className="v3-ex-hero-title">
            <p className="micro-label ex-eyebrow-live">
              <i className="dot-spark" aria-hidden="true" />
              <Bi
                text={
                  exhibition.subtitle?.zh
                    ? exhibition.subtitle
                    : { zh: "年度展览", en: "Annual exhibition" }
                }
              />{" "}
              · {exhibition.period.zh}
            </p>
            <h1 className="v3-display">
              Himalayan <em>Art {year}</em>
            </h1>
            <p className="v3-ex26-cn">喜 马 拉 雅 艺 术 · 二 〇 二 六</p>
          </div>
          <div className="v3-ex26-vajra">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={vajraRef}
              src="/uploads/artworks/five-pronged-vajra-cover-cutout-2026.png"
              alt="五股金刚杵"
            />
          </div>
          <div className="v3-ex26-copy" data-reveal="">
            <h2>
              <Bi text={exhibition.title} />
            </h2>
            <p>
              <Bi text={exhibition.catalogueIntro} />
            </p>
            <div className="v3-btn-row">
              <V3Button
                variant="light"
                zh="翻阅电子图录"
                en="Read the Catalogue"
                onClick={() => setFullSignal((n) => n + 1)}
              />
              <a
                className="v3-link v3-link-light"
                href="#preface"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("preface")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="t-zh">阅读序言</span>
                <span className="t-en" lang="en">
                  Preface
                </span>
                <i aria-hidden="true">↓</i>
              </a>
            </div>
          </div>
        </div>
        <div className="container">
          <dl className="v3-ex-facts" data-stagger="">
            <div data-reveal="">
              <dt>
                <span className="t-zh">展期</span>
                <span className="t-en" lang="en">
                  Dates
                </span>
              </dt>
              <dd>{exhibition.period.zh}</dd>
            </div>
            <div data-reveal="">
              <dt>
                <span className="t-zh">地点</span>
                <span className="t-en" lang="en">
                  Venue
                </span>
              </dt>
              <dd>
                <Bi text={exhibition.venue} />
              </dd>
            </div>
            <div data-reveal="">
              <dt>
                <span className="t-zh">展出作品</span>
                <span className="t-en" lang="en">
                  Works
                </span>
              </dt>
              <dd>
                <b data-count={worksCount || 34}>{worksCount || 34}</b>{" "}
                <span className="t-zh">件</span>
              </dd>
            </div>
            <div data-reveal="">
              <dt>
                <span className="t-zh">电子图版</span>
                <span className="t-en" lang="en">
                  Plates
                </span>
              </dt>
              <dd>
                <b data-count={pageCount}>{pageCount}</b> <span className="t-zh">幅</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <PrefaceSection exhibition={exhibition} />

      <section className="v3-cat-sec" id="catalogue">
        <div className="container">
          <SectionHead
            eyebrow="DIGITAL CATALOGUE · 电子图录"
            zh="翻阅图录"
            en="The Catalogue"
            right={
              <button
                type="button"
                className="v3-link"
                onClick={() => setFullSignal((n) => n + 1)}
              >
                <span className="t-zh">沉浸全屏阅读</span>
                <span className="t-en" lang="en">
                  Full-screen studio
                </span>
                <i aria-hidden="true">→</i>
              </button>
            }
          />
        </div>
        <V3InlineCatalogue exhibition={exhibition} openFullscreenSignal={fullSignal} />
      </section>

      <ArchiveGallery
        list={pastExhibitions}
        allExhibitions={allExhibitions}
        eyebrow="ARCHIVE · 历年展览与图录"
        zhTitle="历年展览与图录"
        enTitle="Past Exhibitions & Catalogues"
      />
    </>
  );
}

export function V3PastExhibition({
  exhibition,
  otherExhibitions,
  allExhibitions,
}: {
  exhibition: Exhibition;
  otherExhibitions: Exhibition[];
  allExhibitions: Exhibition[];
}) {
  const { setDarkHero } = useV3();
  const [fullSignal, setFullSignal] = useState(0);

  useV3Reveal(`ex-past-${exhibition.slug}`);

  useEffect(() => {
    setDarkHero(false);
  }, [setDarkHero]);

  const year = extractYear(exhibition.period.zh);
  const pageCount = exhibition.cataloguePageImages?.length || exhibition.cataloguePages || 0;

  return (
    <>
      <section className="v3-exd-hero container">
        <div className="v3-exd-copy">
          <HistoryBackLink fallbackHref="/exhibitions" className="v3-crumb">
            ← <span className="t-zh">展览与图录</span>
            <span className="t-en" lang="en">
              Exhibitions
            </span>
          </HistoryBackLink>
          <p className="micro-label v3-eyebrow">
            {year} · <Bi text={exhibition.venue} />
          </p>
          <h1 className="v3-h1">
            <Bi text={exhibition.title} />
          </h1>
          <p className="v3-lead">
            <Bi text={exhibition.catalogueIntro?.zh ? exhibition.catalogueIntro : exhibition.intro} />
          </p>
          <dl className="v3-exd-facts">
            <div>
              <dt>
                <span className="t-zh">展期</span>
                <span className="t-en" lang="en">
                  Dates
                </span>
              </dt>
              <dd>{exhibition.period.zh}</dd>
            </div>
            <div>
              <dt>
                <span className="t-zh">地点</span>
                <span className="t-en" lang="en">
                  Venue
                </span>
              </dt>
              <dd>
                <Bi text={exhibition.venue} />
              </dd>
            </div>
            <div>
              <dt>
                <span className="t-zh">图录</span>
                <span className="t-en" lang="en">
                  Catalogue
                </span>
              </dt>
              <dd>
                <b data-count={pageCount}>{pageCount}</b> <span className="t-zh">页</span>
                <span className="t-en" lang="en">
                  pp.
                </span>
              </dd>
            </div>
          </dl>
          <div className="v3-btn-row">
            <V3Button
              variant="dark"
              zh="翻阅电子图录"
              en="Read the Catalogue"
              onClick={() => setFullSignal((n) => n + 1)}
            />
            <a
              className="v3-link"
              href="#preface"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("preface")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="t-zh">阅读序言</span>
              <span className="t-en" lang="en">
                Preface
              </span>
              <i aria-hidden="true">↓</i>
            </a>
          </div>
        </div>
        <figure className="v3-exd-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveExhibitionCover(exhibition)} alt={exhibition.title.zh} />
        </figure>
      </section>

      <PrefaceSection exhibition={exhibition} />

      <section className="v3-cat-sec" id="catalogue">
        <div className="container">
          <SectionHead
            eyebrow="DIGITAL CATALOGUE · 电子图录"
            zh="翻阅图录"
            en="The Catalogue"
            right={
              <button
                type="button"
                className="v3-link"
                onClick={() => setFullSignal((n) => n + 1)}
              >
                <span className="t-zh">沉浸全屏阅读</span>
                <span className="t-en" lang="en">
                  Full-screen studio
                </span>
                <i aria-hidden="true">→</i>
              </button>
            }
          />
        </div>
        <V3InlineCatalogue exhibition={exhibition} openFullscreenSignal={fullSignal} />
      </section>

      <ArchiveGallery
        list={otherExhibitions}
        allExhibitions={allExhibitions}
        eyebrow="MORE EXHIBITIONS · 历年展览与图录"
        zhTitle="历年展览与图录"
        enTitle="Other Annual Exhibitions"
      />
    </>
  );
}
