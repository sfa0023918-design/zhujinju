"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HistoryBackLink } from "@/components/history-back-link";
import {
  getArticleDisplayExcerpt,
  getRenderableArticleContentBlocks,
  resolveArticleCover,
} from "@/lib/article-content";
import type { ExhibitionEditorial } from "@/lib/data/exhibition-editorial";
import type { Article, Artwork, BilingualText, Exhibition } from "@/lib/data/types";
import { withImageVersion } from "@/lib/image-url";
import {
  getArtworkCardSrc,
  getArtworkFacts,
  padNumber,
} from "@/lib/v3-helpers";
import { useV3 } from "./v3-shell";
import { ArrowLink, Bi, SectionHead, StatusPill, useV3Reveal, V3Button } from "./v3-ui";

function formatDateDots(date: string) {
  return String(date || "").replace(/-/g, ".");
}

function getArticleCoverSrc(article: Article) {
  const raw = resolveArticleCover(article);
  return raw ? withImageVersion(raw) : "";
}

/* ======================================================================
   JOURNAL INDEX
   ====================================================================== */
export function V3JournalIndex({ articles }: { articles: Article[] }) {
  const { lang, setDarkHero } = useV3();
  const [cat, setCat] = useState("all");
  const [swapping, setSwapping] = useState(false);

  const segRef = useRef<HTMLDivElement>(null);
  const segThumbRef = useRef<HTMLDivElement>(null);

  useV3Reveal("journal-index");

  useEffect(() => {
    setDarkHero(false);
  }, [setDarkHero]);

  const lead = useMemo(
    () => articles.find((a) => a.slug === "form-and-devotion-2026") ?? articles[0],
    [articles],
  );

  const categories = useMemo(() => {
    const map = new Map<string, { label: BilingualText; count: number }>();
    articles.forEach((a) => {
      const key = a.category.zh || a.category.en;
      if (!key) return;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { label: a.category, count: 1 });
    });
    return Array.from(map.entries());
  }, [articles]);

  const filtered = useMemo(
    () =>
      cat === "all"
        ? articles
        : articles.filter((a) => (a.category.zh || a.category.en) === cat),
    [articles, cat],
  );

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
  }, [cat, lang, syncSeg]);

  const handleSelectCat = (nextCat: string) => {
    if (nextCat === cat) return;
    setSwapping(true);
    window.setTimeout(() => {
      setCat(nextCat);
      setSwapping(false);
    }, 180);
  };

  const leadCover = lead ? getArticleCoverSrc(lead) : "";
  const leadExcerpt = lead ? getArticleDisplayExcerpt(lead) : { zh: "", en: "" };

  return (
    <>
      <section className="v3-page-head container">
        <p className="micro-label v3-eyebrow">JOURNAL · 文章与动态</p>
        <h1 className="v3-h1">
          <span className="t-zh">文章与动态</span>
          <span className="t-en" lang="en">
            Journal
          </span>
        </h1>
      </section>

      {lead ? (
        <section className="container">
          <Link className="v3-feature" href={`/journal/${lead.slug}`}>
            <div className="v3-feature-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={leadCover} alt={lead.title.zh} />
            </div>
            <div className="v3-feature-copy">
              <p className="micro-label v3-eyebrow v3-eyebrow-live">
                <i className="dot-spark" aria-hidden="true" />
                <span className="t-zh">精选专题</span>
                <span className="t-en" lang="en">
                  FEATURED
                </span>{" "}
                · <Bi text={lead.category} /> · {formatDateDots(lead.date)}
              </p>
              <h2 className="v3-h2">
                <Bi text={lead.title} />
              </h2>
              <p className="v3-lead">
                <Bi text={leadExcerpt} />
              </p>
              <span className="v3-link">
                <span className="t-zh">阅读专题</span>
                <span className="t-en" lang="en">
                  Read
                </span>
                <i aria-hidden="true">→</i>
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="container v3-journal-list">
        <div className="v3-toolbar-inner v3-journal-filter">
          <div ref={segRef} className="segmented-control" role="group" aria-label="分类">
            <div ref={segThumbRef} className="seg-thumb" aria-hidden="true" />
            <button
              type="button"
              className={`seg-btn${cat === "all" ? " is-active" : ""}`}
              onClick={() => handleSelectCat("all")}
            >
              <span className="t-zh">全部</span>
              <span className="t-en" lang="en">
                All
              </span>
              <span className="seg-count">{articles.length}</span>
            </button>
            {categories.map(([key, item]) => (
              <button
                key={key}
                type="button"
                className={`seg-btn${cat === key ? " is-active" : ""}`}
                onClick={() => handleSelectCat(key)}
              >
                <Bi text={item.label} />
                <span className="seg-count">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        <ol className={`v3-rows v3-rows-journal${swapping ? " is-swap" : ""}`} data-stagger="">
          {filtered.map((a) => {
            const cover = getArticleCoverSrc(a);
            const excerpt = getArticleDisplayExcerpt(a);
            return (
              <li key={a.slug}>
                <Link className="v3-row" href={`/journal/${a.slug}`} data-follow={cover}>
                  <span className="row-date">{formatDateDots(a.date)}</span>
                  <span className="row-cat">
                    <Bi text={a.category} />
                  </span>
                  <span className="row-title">
                    <Bi text={a.title} />
                    <small>
                      <Bi text={excerpt} />
                    </small>
                  </span>
                  {cover ? (
                    <span className="row-thumb" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" loading="lazy" />
                    </span>
                  ) : null}
                  <i className="row-arrow" aria-hidden="true">
                    →
                  </i>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}

/* ======================================================================
   STANDARD ARTICLE DETAIL
   ====================================================================== */
export function V3ArticleDetail({
  article,
  nextArticle,
  relatedWorks,
  relatedExhibitions,
  artworkIndexMap,
}: {
  article: Article;
  nextArticle?: Article;
  relatedWorks: Artwork[];
  relatedExhibitions: Exhibition[];
  artworkIndexMap: Record<string, number>;
}) {
  const { lang, setDarkHero } = useV3();
  useV3Reveal(`article-${article.slug}`);

  useEffect(() => {
    setDarkHero(false);
  }, [setDarkHero]);

  const blocks = useMemo(() => getRenderableArticleContentBlocks(article), [article]);
  const cover = getArticleCoverSrc(article);
  const excerpt = getArticleDisplayExcerpt(article);
  const primaryTitle = lang === "en" ? article.title.en || article.title.zh : article.title.zh;
  const secondaryTitle = lang === "en" ? article.title.zh : article.title.en;

  return (
    <>
      <article className="v3-article">
        <header className="container v3-art-head">
          <HistoryBackLink fallbackHref="/journal" className="v3-crumb">
            ← <span className="t-zh">文章与动态</span>
            <span className="t-en" lang="en">
              Journal
            </span>
          </HistoryBackLink>
          <p className="micro-label v3-eyebrow">
            <Bi text={article.category} /> · {formatDateDots(article.date)}
            {article.author?.zh || article.author?.en ? (
              <>
                {" "}
                · <Bi text={article.author} />
              </>
            ) : null}
          </p>
          <h1 className="v3-art-title">{primaryTitle}</h1>
          {secondaryTitle && secondaryTitle !== primaryTitle ? (
            <p className="v3-art-en" lang={lang === "en" ? "zh" : "en"}>
              {secondaryTitle}
            </p>
          ) : null}
          {excerpt.zh || excerpt.en ? (
            <p className="v3-lead">
              <Bi text={excerpt} />
            </p>
          ) : null}
        </header>

        {cover ? (
          <figure className="v3-art-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={article.title.zh} />
          </figure>
        ) : null}

        <div className="container v3-art-body">
          {blocks.map((block, idx) => {
            if (block.type === "paragraph") {
              const zh = block.content.zh || block.content.en;
              const en = block.content.en || block.content.zh;
              return (
                <p key={idx} className="art-p" data-reveal="">
                  <span className="t-zh">{zh}</span>
                  <span className="t-en" lang="en">
                    {en}
                  </span>
                </p>
              );
            }
            if (block.type === "image") {
              const layout = block.layout === "inline" ? "inline" : "wide";
              return (
                <figure key={idx} className={`art-fig art-fig-${layout}`} data-reveal="">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withImageVersion(block.image)}
                    alt={block.caption?.zh || article.title.zh}
                    loading="lazy"
                  />
                  {block.caption?.zh || block.caption?.en ? (
                    <figcaption>
                      <Bi text={block.caption} />
                    </figcaption>
                  ) : null}
                </figure>
              );
            }
            const validItems = block.items.filter((it) => it.image);
            if (!validItems.length) return null;
            return (
              <div key={idx} className="art-fig-pair" data-reveal="">
                {validItems.map((it, ii) => (
                  <figure key={ii} className="art-fig art-fig-inline">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={withImageVersion(it.image)}
                      alt={it.caption?.zh || article.title.zh}
                      loading="lazy"
                    />
                    {it.caption?.zh || it.caption?.en ? (
                      <figcaption>
                        <Bi text={it.caption} />
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            );
          })}
        </div>

        {article.keywords?.length ? (
          <div className="container v3-art-tags">
            {article.keywords
              .filter((k) => k.zh?.trim() || k.en?.trim())
              .map((k, i) => (
                <span key={i} className="v3-tag">
                  <Bi text={k} />
                </span>
              ))}
          </div>
        ) : null}

        {relatedExhibitions.length ? (
          <div className="container v3-art-tags" style={{ marginTop: 18 }}>
            {relatedExhibitions.map((ex) => (
              <Link
                key={ex.slug}
                href={ex.current ? "/exhibitions" : `/exhibitions/${ex.slug}`}
                className="v3-link"
              >
                <Bi text={ex.title} />
                <i aria-hidden="true">↗</i>
              </Link>
            ))}
          </div>
        ) : null}
      </article>

      {relatedWorks.length ? (
        <section className="container v3-ex-works">
          <SectionHead
            eyebrow="WORKS IN THIS ARTICLE"
            zh="文中作品"
            en="Works Discussed"
          />
          <div className="v3-wall is-entering is-go">
            {relatedWorks.map((work, wi) => {
              const no = (artworkIndexMap[work.slug] ?? wi) + 1;
              return (
                <Link key={work.slug} href={`/collection/${work.slug}`} className="tile" data-cursor="view">
                  <div className="tile-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getArtworkCardSrc(work)} alt={work.title.zh} loading="lazy" />
                  </div>
                  <div className="tile-meta">
                    <div className="tile-head">
                      <span className="tile-no">{padNumber(no)}</span>
                      <h3>
                        <Bi text={work.title} />
                      </h3>
                    </div>
                    <div className="tile-foot">
                      <p>
                        <Bi text={getArtworkFacts(work, ["region", "period", "material"])} />
                      </p>
                      <StatusPill status={work.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {nextArticle ? (
        <Link className="v3-next" href={`/journal/${nextArticle.slug}`}>
          <div className="container v3-next-inner">
            <div>
              <p className="micro-label">
                <span className="t-zh">下一篇</span>
                <span className="t-en" lang="en">
                  Next article
                </span>
              </p>
              <h2>
                <Bi text={nextArticle.title} />
              </h2>
              <p>
                <Bi text={nextArticle.category} /> · {formatDateDots(nextArticle.date)}
              </p>
            </div>
            <div className="v3-next-img tile-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getArticleCoverSrc(nextArticle)} alt="" loading="lazy" />
            </div>
          </div>
        </Link>
      ) : null}
    </>
  );
}

/* ======================================================================
   DEDICATED EXHIBITION EDITORIAL ("形有所寄")
   Preserves exclusive 3 chapter tones (#8f3b2b, #5d3a4f, #3d5a48) & 12 artwork links
   ====================================================================== */
const CHAPTER_TONES: Record<string, string> = {
  cinnabar: "#8f3b2b",
  plum: "#5d3a4f",
  green: "#3d5a48",
};

export function V3ExhibitionEditorial({
  article,
  editorial: e,
  nextArticle,
}: {
  article: Article;
  editorial: ExhibitionEditorial;
  nextArticle?: Article;
}) {
  const { lang, setDarkHero } = useV3();
  const [activeId, setActiveId] = useState("preface");
  const navInnerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);

  useV3Reveal(`editorial-${article.slug}`);

  useEffect(() => {
    setDarkHero(false);
  }, [setDarkHero]);

  const syncBar = useCallback((id: string) => {
    const nav = navInnerRef.current;
    const bar = barRef.current;
    if (!nav || !bar) return;
    const act = nav.querySelector<HTMLElement>(`[data-ed="${id}"]`);
    if (!act) return;
    bar.style.width = `${act.offsetWidth}px`;
    bar.style.transform = `translateX(${act.offsetLeft}px)`;
    const tone = getComputedStyle(act).getPropertyValue("--tone").trim();
    bar.style.background = tone || "var(--ink)";
    const targetLeft = Math.max(0, act.offsetLeft - (nav.clientWidth - act.offsetWidth) / 2);
    nav.scrollTo({ left: targetLeft, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-ed-sec]"));
      if (!secs.length) return;
      let id = secs[0].dataset.edSec || "preface";
      secs.forEach((sec) => {
        if (sec.getBoundingClientRect().top < window.innerHeight * 0.35) {
          id = sec.dataset.edSec || id;
        }
      });
      setActiveId((prev) => (prev === id ? prev : id));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => syncBar(activeId));
    const onResize = () => syncBar(activeId);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [activeId, lang, syncBar]);

  const scrollToSection = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const primaryTitle = lang === "en" ? e.title.en || e.title.zh : e.title.zh;
  const secondaryTitle = lang === "en" ? e.title.zh : e.title.en;

  return (
    <>
      <article className="v3-editorial">
        <header className="ed-hero">
          <div className="container ed-hero-grid">
            <div className="ed-hero-copy">
              <HistoryBackLink fallbackHref="/journal" className="v3-crumb">
                ← <span className="t-zh">文章与动态</span>
                <span className="t-en" lang="en">
                  Journal
                </span>
              </HistoryBackLink>
              <p className="micro-label v3-eyebrow">
                <Bi text={e.subtitle} />
              </p>
              <h1 className="ed-title">{primaryTitle}</h1>
              {secondaryTitle && secondaryTitle !== primaryTitle ? (
                <p className="ed-title-en" lang={lang === "en" ? "zh" : "en"}>
                  {secondaryTitle}
                </p>
              ) : null}
              {e.eventLine ? <p className="ed-event">{e.eventLine}</p> : null}
            </div>
            <figure className="ed-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withImageVersion(e.cover.src)} alt={e.cover.alt} />
              {e.cover.alt ? <figcaption>{e.cover.alt}</figcaption> : null}
            </figure>
          </div>
        </header>

        <nav className="ed-nav" aria-label="本文章节">
          <div ref={navInnerRef} className="container ed-nav-inner">
            <a
              href="#ed-preface"
              data-ed="preface"
              className={activeId === "preface" ? "is-active" : undefined}
              onClick={scrollToSection("ed-preface")}
            >
              <span className="t-zh">序</span>
              <span className="t-en" lang="en">
                Preface
              </span>
            </a>
            {e.chapters.map((c) => (
              <a
                key={c.id}
                href={`#ed-${c.id}`}
                data-ed={c.id}
                className={activeId === c.id ? "is-active" : undefined}
                style={{ ["--tone" as string]: CHAPTER_TONES[c.tone] || "#8f3b2b" }}
                onClick={scrollToSection(`ed-${c.id}`)}
              >
                <Bi text={c.title} />
              </a>
            ))}
            <a
              href="#ed-closing"
              data-ed="closing"
              className={activeId === "closing" ? "is-active" : undefined}
              onClick={scrollToSection("ed-closing")}
            >
              <span className="t-zh">结语</span>
              <span className="t-en" lang="en">
                Closing
              </span>
            </a>
            <i ref={barRef} className="ed-nav-bar" aria-hidden="true" />
          </div>
        </nav>

        <section className="container ed-preface" id="ed-preface" data-ed-sec="preface">
          <h2 className="v3-h3">{e.prefaceTitle || "序"}</h2>
          {e.prefaceLead ? <p className="v3-preface-lead ed-lead">{e.prefaceLead}</p> : null}
          <div className="ed-preface-grid">
            <figure data-reveal="">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withImageVersion(e.prefacePortrait.src)}
                alt={e.prefacePortrait.alt}
                loading="lazy"
              />
            </figure>
            <div>
              {(e.prefaceFirst ?? []).map((p, i) => (
                <p key={i} data-reveal="">
                  {p}
                </p>
              ))}
            </div>
          </div>
          <figure className="ed-wide" data-reveal="">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withImageVersion(e.prefaceLandscape.src)}
              alt={e.prefaceLandscape.alt}
              loading="lazy"
            />
          </figure>
          <div className="ed-col">
            {(e.prefaceSecond ?? []).map((p, i) => (
              <p key={i} data-reveal="">
                {p}
              </p>
            ))}
            {e.introduction ? (
              <p className="ed-intro" data-reveal="">
                {e.introduction}
              </p>
            ) : null}
          </div>
        </section>

        {e.chapters.map((chapter, ci) => (
          <section
            key={chapter.id}
            className="ed-chapter"
            id={`ed-${chapter.id}`}
            data-ed-sec={chapter.id}
            style={{ ["--tone" as string]: CHAPTER_TONES[chapter.tone] || "#8f3b2b" }}
          >
            <div className="ed-chapter-head">
              <div className="container">
                <span className="ed-ch-no">{padNumber(ci + 1)}</span>
                <h2>
                  <Bi text={chapter.title} />
                </h2>
                <p>
                  {chapter.introduction.split("\n").map((line, li, arr) => (
                    <span key={li}>
                      {line}
                      {li < arr.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <div className="container">
              {chapter.works.map((w, wi) => {
                const workHref = w.collectionSlug ? `/collection/${w.collectionSlug}` : "/collection";
                return (
                  <article
                    key={w.id}
                    id={w.id}
                    className={`ed-work${wi % 2 ? " is-flip" : ""}`}
                  >
                    <Link
                      className="ed-work-media"
                      href={workHref}
                      data-cursor="view"
                      data-reveal=""
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={withImageVersion(w.image.src)}
                        alt={w.image.alt || w.title.zh}
                        loading="lazy"
                      />
                    </Link>
                    <div className="ed-work-copy">
                      <p className="micro-label">
                        <Bi text={w.region} /> · <Bi text={w.period} />
                      </p>
                      <h3 data-reveal="">
                        <Bi text={w.title} />
                      </h3>
                      {w.heading ? (
                        <p className="ed-work-heading" data-reveal="">
                          {w.heading}
                        </p>
                      ) : null}
                      {(w.paragraphs ?? []).map((p, pi) => (
                        <p key={pi} data-reveal="">
                          {p}
                        </p>
                      ))}
                      {w.detail ? (
                        <figure className="ed-detail-fig" data-reveal="">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={withImageVersion(w.detail.src)}
                            alt={w.detail.alt}
                            loading="lazy"
                          />
                          {w.detail.alt ? <figcaption>{w.detail.alt}</figcaption> : null}
                        </figure>
                      ) : null}
                      <details className="ed-records">
                        <summary>
                          <span className="t-zh">资料 · 来源与著录</span>
                          <span className="t-en" lang="en">
                            Records
                          </span>
                        </summary>
                        <p className="ed-basic">
                          <Bi text={w.material} />
                          {w.technique?.zh ? (
                            <>
                              {" · "}
                              <Bi text={w.technique} />
                            </>
                          ) : null}
                          {w.dimensions ? ` · ${w.dimensions}` : ""}
                        </p>
                        {(w.records ?? []).map((r, ri) => (
                          <div key={ri} className="ed-rec">
                            <h5>
                              <Bi text={r.label} />
                            </h5>
                            {(r.lines ?? []).map((line, li) => (
                              <p key={li}>{line}</p>
                            ))}
                          </div>
                        ))}
                      </details>
                      {w.collectionSlug ? (
                        <Link className="v3-link" href={`/collection/${w.collectionSlug}`}>
                          <span className="t-zh">作品详情</span>
                          <span className="t-en" lang="en">
                            View artwork
                          </span>
                          <i aria-hidden="true">↗</i>
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <section className="container ed-closing" id="ed-closing" data-ed-sec="closing">
          <h2 className="v3-h3">{e.closingTitle || "结语"}</h2>
          {(e.closing ?? []).map((p, i) => (
            <p key={i} data-reveal="">
              {p}
            </p>
          ))}
          <div className="v3-btn-row">
            <V3Button
              href={`/exhibitions/${e.exhibitionSlug || "himalayan-art-2026"}#catalogue`}
              zh="展览与电子图录"
              en="Exhibition & Catalogue"
            />
            {e.pdf ? (
              <a className="v3-link" href={e.pdf} download>
                <span className="t-zh">下载本文 PDF</span>
                <span className="t-en" lang="en">
                  Download PDF
                </span>
                <i aria-hidden="true">↓</i>
              </a>
            ) : null}
            <ArrowLink href="/contact" zh="联系与到访" en="Contact & Visit" />
          </div>
        </section>
      </article>

      {nextArticle ? (
        <Link className="v3-next" href={`/journal/${nextArticle.slug}`}>
          <div className="container v3-next-inner">
            <div>
              <p className="micro-label">
                <span className="t-zh">下一篇</span>
                <span className="t-en" lang="en">
                  Next article
                </span>
              </p>
              <h2>
                <Bi text={nextArticle.title} />
              </h2>
              <p>
                <Bi text={nextArticle.category} /> · {formatDateDots(nextArticle.date)}
              </p>
            </div>
            <div className="v3-next-img tile-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getArticleCoverSrc(nextArticle)} alt="" loading="lazy" />
            </div>
          </div>
        </Link>
      ) : null}
    </>
  );
}
