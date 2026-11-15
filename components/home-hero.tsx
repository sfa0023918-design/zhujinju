"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ProtectedImage } from "@/components/protected-image";
import { HomeArrow } from "@/components/home-ui";
import { useNativeCarousel } from "./use-native-carousel";
import styles from "@/app/(site)/home.module.css";

export type HomeHeroSlide = {
  slug: string;
  title: { zh: string; en: string };
  image: string;
  width: number;
  height: number;
  facts: string;
  mobileFacts: string;
  status: string;
  statusKey: "inquiry" | "sold" | "reserved";
  background: string;
  fade: string;
  imageHeight: string;
  topFade: boolean;
  bottomFade: boolean;
  lightInk: boolean;
  shaded: boolean;
  framed: boolean;
  imageShift: string;
  mobileHeight: string;
  mobileShift: string;
};

export function HomeHero({
  slides,
  children,
}: {
  slides: HomeHeroSlide[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [native, setNative] = useState(false);
  const carousel = useNativeCarousel({ count: slides.length, active, onChange: setActive, enabled: native, loop: native });

  useEffect(() => {
    const media = window.matchMedia("(any-pointer: coarse), (max-width: 1180px)");
    const update = () => setNative(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionChanged = () => setReducedMotion(reduced.matches);
    const visibilityChanged = () => setVisible(!document.hidden);
    motionChanged();
    visibilityChanged();
    reduced.addEventListener("change", motionChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      reduced.removeEventListener("change", motionChanged);
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, []);

  useEffect(() => {
    if (paused || hovered || focused || reducedMotion || !visible || carousel.interacting || slides.length < 2) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % slides.length), 5000);
    return () => window.clearTimeout(timer);
  }, [active, paused, hovered, focused, reducedMotion, visible, slides.length, carousel.interacting]);

  return (
    <section className={styles.hero} aria-label="首页作品"
      data-native-carousel={native}
      data-hero-tone={slides[active]?.lightInk ? "light" : "dark"}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className={styles.heroField} ref={carousel.ref}
        role={native ? "region" : undefined}
        aria-label={native ? "首页作品图片 Featured artwork images" : undefined}
        tabIndex={native ? 0 : undefined}>
        {carousel.indexes.map((index, position) => {
          const slide = slides[index];
          const clone = native && slides.length > 1 && (position === 0 || position === slides.length + 1);
          return (
            <div
              key={`${slide.slug}-${position}`}
              className={styles.slide}
              aria-hidden={clone || index !== active}
              data-active={index === active}
              data-shaded={slide.shaded}
              style={
                {
                  "--slide-background": slide.background,
                  "--fade": slide.fade,
                  "--image-height": slide.imageHeight,
                  "--image-ratio": slide.height / slide.width,
                  "--mobile-scale": parseFloat(slide.mobileHeight) / 100,
                  "--image-shift": slide.imageShift,
                  "--mobile-height": slide.mobileHeight,
                  "--mobile-shift": slide.mobileShift,
                  opacity: native || index === active ? 1 : 0,
                } as CSSProperties
              }
            >
              <ProtectedImage
                src={slide.image}
                alt={`${slide.title.zh} ${slide.title.en}`}
                width={slide.width}
                height={slide.height}
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : "low"}
                loading={index === 0 ? undefined : "eager"}
                quality={85}
                sizes="(max-width: 860px) 100vw, 1024px"
                wrapperClassName={`${styles.heroImageFrame} ${slide.topFade ? styles.topFade : ""} ${slide.bottomFade ? styles.bottomFade : ""} ${slide.framed ? styles.framedArtwork : ""}`}
                className={styles.heroImage}
              />
            </div>
          );
        })}
      </div>
      {slides.length ? (
        <div className={styles.captionBar}>
          {slides.map((slide, index) => (
            <Link
              key={slide.slug}
              href={`/collection/${slide.slug}`}
              className={styles.caption}
              tabIndex={index === active ? 0 : -1}
              aria-hidden={index !== active}
              style={{
                opacity: index === active ? 1 : 0,
                pointerEvents: index === active ? "auto" : "none",
              }}
            >
              <span className={styles.captionNumber}>
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </span>
              <span className={styles.captionTitle}>
                <span>{slide.title.zh}</span>
                <span lang="en">{slide.title.en}</span>
              </span>
              <span className={styles.captionFacts}>{slide.facts}</span>
              <span className={styles.captionStatus} data-artwork-status={slide.statusKey}>
                <i className={styles.statusDot} data-status={slide.statusKey} />
                {slide.status}
                <span className={styles.mobileCaptionFacts}>
                  {" "}
                  · {slide.mobileFacts}
                </span>
              </span>
              <span className={styles.captionGo}>
                查看作品 <small lang="en">View work</small>
                <HomeArrow />
              </span>
            </Link>
          ))}
          <div role="group" aria-label="切换首页作品" className={styles.ticks}>
            {!reducedMotion && slides.length > 1 ? (
              <button type="button" className={styles.playback} aria-pressed={paused}
                aria-label={paused ? "播放作品轮播 Play slideshow" : "暂停作品轮播 Pause slideshow"}
                onClick={() => setPaused((value) => !value)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  {paused ? <path d="m5 3 7 5-7 5V3Z" stroke="currentColor" strokeWidth="1.25" />
                    : <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.5" />}
                </svg>
              </button>
            ) : null}
            {slides.map((slide, index) => (
              <button
                key={slide.slug}
                type="button"
                className={styles.tick}
                aria-label={`第 ${index + 1} 件：${slide.title.zh}`}
                aria-pressed={index === active}
                onClick={() => {
                  setActive(index);
                }}
              >
                <span />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className={`${styles.wrap} ${styles.heroCopy}`}>{children}</div>
    </section>
  );
}
