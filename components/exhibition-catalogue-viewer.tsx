"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";
import {
  catalogueImageVariant,
  cataloguePageGeometry,
} from "@/lib/catalogue-media";

import styles from "./exhibition-catalogue-viewer.module.css";
import { ProtectedImage } from "./protected-image";
import { MobileCatalogueReader } from "./mobile-catalogue-reader";

const DESKTOP_BREAKPOINT = "(min-width: 1181px) and (pointer: fine)";
const PRELOAD_GROUP_OFFSETS = [-1, 1] as const;
// A page can be shared as /exhibitions/<slug>#catalogue-p37.
const PAGE_HASH_PATTERN = /^#catalogue-p(\d+)$/;

type ExhibitionCatalogueViewerProps = {
  title: BilingualValue;
  note: BilingualValue;
  pages: string[];
  viewMode?: "single-pages" | "spread-images";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function writePageHash(index: number) {
  const hash = `#catalogue-p${index + 1}`;

  if (window.location.hash === hash) {
    return;
  }

  // Keep the existing history state (return-to-position data) and only change the hash.
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}${hash}`,
  );
}

function getDesktopStartIndex(index: number, totalPages: number) {
  if (totalPages <= 1) {
    return 0;
  }

  const aligned = index % 2 === 0 ? index : index - 1;
  const lastStart = totalPages % 2 === 0 ? totalPages - 2 : totalPages - 1;
  return clamp(aligned, 0, Math.max(0, lastStart));
}

export function ExhibitionCatalogueViewer({
  title,
  note,
  pages,
  viewMode = "single-pages",
}: ExhibitionCatalogueViewerProps) {
  const cataloguePages = useMemo(() => pages.filter(Boolean), [pages]);
  const readerPages = useMemo(
    () => cataloguePages.map((page) => catalogueImageVariant(page, "reader")),
    [cataloguePages],
  );
  const thumbPages = useMemo(
    () => cataloguePages.map((page) => catalogueImageVariant(page, "thumb")),
    [cataloguePages],
  );
  const geometries = useMemo(
    () =>
      cataloguePages.map((page) =>
        cataloguePageGeometry(page, viewMode === "spread-images"),
      ),
    [cataloguePages, viewMode],
  );
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreenReading, setIsFullscreenReading] = useState(false);
  const [isDesktopReaderOpen, setIsDesktopReaderOpen] = useState(false);
  const hasNavigatedRef = useRef(false);
  const desktopFullscreenButtonRef = useRef<HTMLButtonElement | null>(null);
  const [thumbnailImageIndexes, setThumbnailImageIndexes] = useState<
    Set<number>
  >(() => new Set([0]));
  const touchStartX = useRef<number | null>(null);
  const preloadedPagesRef = useRef<Set<string>>(new Set());
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);
  const selectedThumbnailRef = useRef<HTMLButtonElement | null>(null);
  const totalPages = cataloguePages.length;
  const showsSpreadImage = viewMode === "spread-images";
  const usesMobileReader = isLayoutReady && (!isDesktop || isFullscreenReading);
  const usesDesktopPairing =
    isDesktop && !showsSpreadImage && !usesMobileReader;
  const usesPairedPages = !showsSpreadImage;
  const preloadsPairedPages = usesPairedPages;

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);

    function updateLayout() {
      setIsDesktop(mediaQuery.matches);
      setIsLayoutReady(true);
    }

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    setCurrentIndex((previous) => {
      if (!totalPages) {
        return 0;
      }

      return usesPairedPages
        ? getDesktopStartIndex(previous, totalPages)
        : clamp(previous, 0, totalPages - 1);
    });
  }, [usesPairedPages, totalPages]);

  useEffect(() => {
    const match = window.location.hash.match(PAGE_HASH_PATTERN);

    if (!match || !totalPages) {
      return;
    }

    const requestedIndex = clamp(Number(match[1]) - 1, 0, totalPages - 1);
    setCurrentIndex(
      usesPairedPages
        ? getDesktopStartIndex(requestedIndex, totalPages)
        : requestedIndex,
    );
    document.getElementById("catalogue")?.scrollIntoView();
  }, [totalPages, usesPairedPages]);

  useEffect(() => {
    if (hasNavigatedRef.current) {
      writePageHash(currentIndex);
    }
  }, [currentIndex]);

  const handleMobileFullscreenChange = useCallback(
    (open: boolean) => {
      setIsFullscreenReading(open);
      if (!open && hasNavigatedRef.current) {
        writePageHash(currentIndex);
      }
    },
    [currentIndex],
  );

  const handleDesktopFullscreenChange = useCallback(
    (open: boolean) => {
      if (open) {
        return;
      }

      setIsDesktopReaderOpen(false);
      desktopFullscreenButtonRef.current?.focus({ preventScroll: true });
      if (hasNavigatedRef.current) {
        writePageHash(currentIndex);
      }
    },
    [currentIndex],
  );

  useEffect(() => {
    if (!readerPages.length || !isLayoutReady) {
      return;
    }

    const groupSize = preloadsPairedPages ? 2 : 1;

    for (let slot = 0; slot < groupSize; slot += 1) {
      const visibleSource = readerPages[currentIndex + slot];
      if (visibleSource) {
        preloadedPagesRef.current.add(visibleSource);
      }
    }

    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;

    if (
      connection?.saveData ||
      connection?.effectiveType === "2g" ||
      connection?.effectiveType === "slow-2g"
    ) {
      return;
    }

    const groupStep = groupSize;
    const candidateIndexes = new Set<number>();

    PRELOAD_GROUP_OFFSETS.forEach((offset) => {
      const groupStart = currentIndex + groupStep * offset;

      for (let slot = 0; slot < groupSize; slot += 1) {
        candidateIndexes.add(groupStart + slot);
      }
    });

    candidateIndexes.forEach((index) => {
      const src = readerPages[index];

      if (!src || preloadedPagesRef.current.has(src)) {
        return;
      }

      const image = new window.Image();
      image.decoding = "async";
      image.fetchPriority = "low";
      image.src = src;
      preloadedPagesRef.current.add(src);
      void image.decode?.().catch(() => {});
    });
  }, [readerPages, currentIndex, isLayoutReady, preloadsPairedPages]);

  useEffect(() => {
    const strip = thumbnailStripRef.current;
    const selected = selectedThumbnailRef.current;

    if (!strip || !selected) {
      return;
    }

    const targetLeft =
      selected.offsetLeft - (strip.clientWidth - selected.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" });
  }, [currentIndex, usesDesktopPairing]);

  useEffect(() => {
    setThumbnailImageIndexes((previous) => {
      const next = new Set(previous);
      next.add(currentIndex);

      if (usesDesktopPairing && currentIndex + 1 < totalPages) {
        next.add(currentIndex + 1);
      }

      return next.size === previous.size ? previous : next;
    });
  }, [currentIndex, totalPages, usesDesktopPairing]);

  useEffect(() => {
    const strip = thumbnailStripRef.current;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;

    if (
      !strip ||
      typeof IntersectionObserver === "undefined" ||
      connection?.saveData ||
      connection?.effectiveType === "2g" ||
      connection?.effectiveType === "slow-2g"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIndexes = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) =>
            Number((entry.target as HTMLElement).dataset.thumbnailIndex),
          )
          .filter(Number.isInteger);

        if (!visibleIndexes.length) {
          return;
        }

        setThumbnailImageIndexes((previous) => {
          const next = new Set(previous);
          visibleIndexes.forEach((index) => next.add(index));
          return next.size === previous.size ? previous : next;
        });
      },
      {
        root: strip,
        rootMargin: "0px 160px",
        threshold: 0.01,
      },
    );

    strip
      .querySelectorAll<HTMLElement>("[data-thumbnail-index]")
      .forEach((thumbnail) => {
        observer.observe(thumbnail);
      });

    return () => observer.disconnect();
  }, [cataloguePages.length]);

  if (!totalPages) {
    return null;
  }

  const visiblePages = usesPairedPages
    ? [readerPages[currentIndex] ?? null, readerPages[currentIndex + 1] ?? null]
    : [readerPages[currentIndex] ?? null];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = usesDesktopPairing
    ? currentIndex + 2 < totalPages
    : currentIndex + 1 < totalPages;
  const currentLabel = usesDesktopPairing
    ? `${currentIndex + 1}${cataloguePages[currentIndex + 1] ? ` - ${currentIndex + 2}` : ""}`
    : `${currentIndex + 1}`;
  const visiblePageNumbers = visiblePages
    .map((page, index) => (page ? currentIndex + index + 1 : null))
    .filter((pageNumber): pageNumber is number => pageNumber !== null);
  const stageSummary =
    visiblePageNumbers.length > 1
      ? `${visiblePageNumbers[0]} - ${visiblePageNumbers[visiblePageNumbers.length - 1]}`
      : `${visiblePageNumbers[0] ?? 1}`;
  function jumpTo(index: number) {
    if (!totalPages) {
      return;
    }

    hasNavigatedRef.current = true;
    setCurrentIndex(
      usesPairedPages
        ? getDesktopStartIndex(index, totalPages)
        : clamp(index, 0, totalPages - 1),
    );
  }

  function goPrevious() {
    if (!canGoPrevious) {
      return;
    }

    hasNavigatedRef.current = true;
    setCurrentIndex((previous) =>
      usesDesktopPairing
        ? Math.max(0, previous - 2)
        : Math.max(0, previous - 1),
    );
  }

  function goNext() {
    if (!canGoNext) {
      return;
    }

    hasNavigatedRef.current = true;
    setCurrentIndex((previous) => {
      if (usesDesktopPairing) {
        return getDesktopStartIndex(
          Math.min(totalPages - 1, previous + 2),
          totalPages,
        );
      }

      return Math.min(totalPages - 1, previous + 1);
    });
  }

  return (
    <div className={styles.viewer}>
      <div className={styles.heading}>
        <h2>
          电子图录 <span lang="en">Catalogue</span>
        </h2>
        {!usesMobileReader ? (
          <button
            ref={desktopFullscreenButtonRef}
            type="button"
            onClick={() => setIsDesktopReaderOpen(true)}
            className={styles.fullscreenButton}
          >
            全屏阅读 <span lang="en">Full screen</span> ↗
          </button>
        ) : null}
      </div>
      <div className={styles.catalogueInfo}>
        <p>
          {title.zh} <span lang="en">{title.en}</span>
        </p>
        <p>
          {note.zh}
          <span lang="en">{note.en}</span>
        </p>
      </div>
      {usesMobileReader ? (
        <MobileCatalogueReader
          title={title}
          pages={cataloguePages}
          readerPages={readerPages}
          thumbPages={thumbPages}
          geometries={geometries}
          pairSingleImages={!showsSpreadImage}
          currentIndex={currentIndex}
          onIndexChange={jumpTo}
          onFullscreenChange={handleMobileFullscreenChange}
        />
      ) : (
        <div id="catalogue-reader" className={styles.desktopReader}>
          <div
            tabIndex={0}
            aria-label="图录翻页区域"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                goPrevious();
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                goNext();
              }
            }}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null) return;
              const endX =
                event.changedTouches[0]?.clientX ?? touchStartX.current;
              const delta = endX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(delta) < 28) return;
              if (delta > 0) goPrevious();
              else goNext();
            }}
            className={styles.stage}
            style={{
              gridTemplateColumns: usesDesktopPairing
                ? "repeat(2,minmax(0,1fr))"
                : "minmax(0,1fr)",
            }}
          >
            {visiblePages.map((page, index) =>
              page ? (
                <ProtectedImage
                  key={`slot-${index}-${page}`}
                  src={page}
                  alt={`${title.zh || title.en} page ${currentIndex + index + 1}`}
                  width={geometries[currentIndex + index]?.width ?? 4000}
                  height={geometries[currentIndex + index]?.height ?? 2358}
                  unoptimized
                  loading="eager"
                  fetchPriority="high"
                  sizes={usesDesktopPairing ? "50vw" : "100vw"}
                  wrapperClassName={styles.pageFrame}
                  className={styles.page}
                />
              ) : (
                <div key={index} />
              ),
            )}
          </div>
          <div className={styles.controls}>
            <span aria-live="polite">
              第 {currentLabel} 页 · {stageSummary} / {totalPages}
            </span>
            <div className={styles.progress} aria-hidden="true">
              <span
                style={{ width: `${((currentIndex + 1) / totalPages) * 100}%` }}
              />
            </div>
            <button
              type="button"
              aria-label="上一页 Prev"
              disabled={!canGoPrevious}
              onClick={goPrevious}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="下一页 Next"
              disabled={!canGoNext}
              onClick={goNext}
            >
              →
            </button>
          </div>
          <div className={styles.index}>
            <p>
              缩略索引 <span lang="en">Index</span>
            </p>
            <div ref={thumbnailStripRef} className={styles.thumbnails}>
              {cataloguePages.map((page, index) => {
                const selected = usesDesktopPairing
                  ? currentIndex === getDesktopStartIndex(index, totalPages)
                  : currentIndex === index;
                return (
                  <button
                    key={`${page}-${index}`}
                    ref={selected ? selectedThumbnailRef : null}
                    type="button"
                    onClick={() => jumpTo(index)}
                    aria-label={`${title.zh || title.en} page ${index + 1}`}
                    aria-current={selected ? "page" : undefined}
                    data-thumbnail-index={index}
                    className={styles.thumbnail}
                  >
                    <span className={styles.thumbnailImage}>
                      {thumbnailImageIndexes.has(index) ? (
                        <ProtectedImage
                          src={thumbPages[index]}
                          alt=""
                          fill
                          unoptimized
                          sizes="180px"
                          className={styles.thumbImage}
                        />
                      ) : null}
                    </span>
                    <span>{String(index + 1).padStart(3, "0")}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {isDesktopReaderOpen ? (
            <MobileCatalogueReader
              presentation="dialog"
              title={title}
              pages={cataloguePages}
              readerPages={readerPages}
              thumbPages={thumbPages}
              geometries={geometries}
              pairSingleImages={!showsSpreadImage}
              currentIndex={currentIndex}
              onIndexChange={jumpTo}
              onFullscreenChange={handleDesktopFullscreenChange}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
