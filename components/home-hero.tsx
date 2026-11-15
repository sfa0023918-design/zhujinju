"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ProtectedImage } from "@/components/protected-image";
import { HomeArrow } from "@/components/home-ui";
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
  mobileColor: string;
  fade: string;
  imageHeight: string;
  topFade: boolean;
  mobileContain: boolean;
};

export function HomeHero({
  slides,
  children,
}: {
  slides: HomeHeroSlide[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const restart = useRef<() => void>(() => {});

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = () => {
      clearInterval(timer.current);
      if (!reduced.matches && slides.length > 1) {
        timer.current = setInterval(
          () => setActive((index) => (index + 1) % slides.length),
          5000,
        );
      }
    };
    const motionChanged = () => {
      if (reduced.matches) setActive(0);
      start();
    };
    restart.current = start;
    start();
    reduced.addEventListener("change", motionChanged);
    return () => {
      clearInterval(timer.current);
      reduced.removeEventListener("change", motionChanged);
    };
  }, [slides.length]);

  return (
    <section className={styles.hero} aria-label="首页作品">
      <div className={styles.heroField}>
        {slides.map((slide, index) => (
          <div
            key={slide.slug}
            className={styles.slide}
            aria-hidden={index !== active}
            data-active={index === active}
            style={
              {
                "--slide-background": slide.background,
                "--slide-mobile": slide.mobileColor,
                "--fade": slide.fade,
                "--image-height": slide.imageHeight,
                opacity: index === active ? 1 : 0,
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
              wrapperClassName={`${styles.heroImageFrame} ${slide.topFade ? styles.topFade : ""} ${slide.mobileContain ? styles.mobileContain : ""}`}
              className={styles.heroImage}
            />
          </div>
        ))}
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
              <span className={styles.captionStatus}>
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
            {slides.map((slide, index) => (
              <button
                key={slide.slug}
                type="button"
                className={styles.tick}
                aria-label={`第 ${index + 1} 件：${slide.title.zh}`}
                aria-pressed={index === active}
                onClick={() => {
                  setActive(index);
                  restart.current();
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
