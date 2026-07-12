"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";
import { ProtectedImage } from "./protected-image";

const DESKTOP_BREAKPOINT = "(min-width: 1024px)";
const MOBILE_PORTRAIT_BREAKPOINT = "(max-width: 767px) and (orientation: portrait)";
const PRELOAD_GROUP_OFFSETS = [-1, 1, 2] as const;

type ExhibitionCatalogueViewerProps = {
  title: BilingualValue;
  note: BilingualValue;
  pages: string[];
  viewMode?: "single-pages" | "spread-images";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const preloadedPagesRef = useRef<Set<string>>(new Set());
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);
  const selectedThumbnailRef = useRef<HTMLButtonElement | null>(null);
  const totalPages = cataloguePages.length;
  const showsSpreadImage = viewMode === "spread-images";
  const usesDesktopPairing = isDesktop && !showsSpreadImage;

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
    const mediaQuery = window.matchMedia(MOBILE_PORTRAIT_BREAKPOINT);

    function updateOrientation() {
      setIsMobilePortrait(mediaQuery.matches);
    }

    updateOrientation();
    mediaQuery.addEventListener("change", updateOrientation);
    return () => mediaQuery.removeEventListener("change", updateOrientation);
  }, []);

  useEffect(() => {
    setCurrentIndex((previous) => {
      if (!totalPages) {
        return 0;
      }

      return isDesktop
        ? showsSpreadImage
          ? clamp(previous, 0, totalPages - 1)
          : getDesktopStartIndex(previous, totalPages)
        : clamp(previous, 0, totalPages - 1);
    });
  }, [isDesktop, showsSpreadImage, totalPages]);

  useEffect(() => {
    if (!cataloguePages.length || !isLayoutReady) {
      return;
    }

    const groupSize = usesDesktopPairing ? 2 : 1;

    for (let slot = 0; slot < groupSize; slot += 1) {
      const visibleSource = cataloguePages[currentIndex + slot];
      if (visibleSource) {
        preloadedPagesRef.current.add(visibleSource);
      }
    }

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;

    if (
      connection?.saveData
      || connection?.effectiveType === "2g"
      || connection?.effectiveType === "slow-2g"
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
      const src = cataloguePages[index];

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
  }, [cataloguePages, currentIndex, isLayoutReady, usesDesktopPairing]);

  useEffect(() => {
    const strip = thumbnailStripRef.current;
    const selected = selectedThumbnailRef.current;

    if (!strip || !selected) {
      return;
    }

    const targetLeft = selected.offsetLeft - (strip.clientWidth - selected.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, targetLeft), behavior: "auto" });
  }, [currentIndex, usesDesktopPairing]);

  if (!totalPages) {
    return null;
  }

  const visiblePages = usesDesktopPairing
    ? [cataloguePages[currentIndex] ?? null, cataloguePages[currentIndex + 1] ?? null]
    : [cataloguePages[currentIndex] ?? null];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = usesDesktopPairing ? currentIndex + 2 < totalPages : currentIndex + 1 < totalPages;
  const currentLabel = usesDesktopPairing
    ? `${currentIndex + 1}${cataloguePages[currentIndex + 1] ? ` - ${currentIndex + 2}` : ""}`
    : `${currentIndex + 1}`;
  const readingModeLabel = showsSpreadImage
    ? "图录页 / Catalogue Page"
    : isDesktop
      ? "双页浏览 / Facing Pages"
      : "单页阅读 / Single Page";
  const visiblePageNumbers = visiblePages
    .map((page, index) => (page ? currentIndex + index + 1 : null))
    .filter((pageNumber): pageNumber is number => pageNumber !== null);
  const stageSummary = visiblePageNumbers.length > 1
    ? `${visiblePageNumbers[0]} - ${visiblePageNumbers[visiblePageNumbers.length - 1]}`
    : `${visiblePageNumbers[0] ?? 1}`;
  const thumbnailImageIndexes = new Set(visiblePageNumbers.map((pageNumber) => pageNumber - 1));

  function jumpTo(index: number) {
    if (!totalPages) {
      return;
    }

    setCurrentIndex(
      usesDesktopPairing ? getDesktopStartIndex(index, totalPages) : clamp(index, 0, totalPages - 1),
    );
  }

  function goPrevious() {
    if (!canGoPrevious) {
      return;
    }

    setCurrentIndex((previous) => (usesDesktopPairing ? Math.max(0, previous - 2) : Math.max(0, previous - 1)));
  }

  function goNext() {
    if (!canGoNext) {
      return;
    }

    setCurrentIndex((previous) => {
      if (usesDesktopPairing) {
        return getDesktopStartIndex(Math.min(totalPages - 1, previous + 2), totalPages);
      }

      return Math.min(totalPages - 1, previous + 1);
    });
  }

  return (
    <div className="space-y-7">
      <div className="grid gap-6 border-b border-[var(--line)]/68 pb-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)] lg:items-end">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.75rem] tracking-[0.08em] text-[var(--accent-text)]">
            <span>电子图录 / DIGITAL CATALOGUE</span>
            <span className="h-px w-8 bg-[var(--line-strong)]/28" aria-hidden="true" />
            <span>{`Page Count / ${totalPages}`}</span>
            <span className="h-px w-8 bg-[var(--line-strong)]/28" aria-hidden="true" />
            <span>{readingModeLabel}</span>
          </div>
          <BilingualText
            as="h2"
            text={title}
            className="font-serif text-[var(--ink)]"
            zhClassName="block max-w-[11ch] text-[2rem] leading-[1.06] tracking-[-0.035em] md:text-[2.82rem]"
            enClassName="mt-3 block text-[0.8125rem] uppercase tracking-[0.08em] leading-[1.5] text-[var(--accent-text)]"
          />
          <div className="flex items-center gap-3 text-[0.75rem] tracking-[0.08em] text-[var(--accent-text)]">
            <span className="h-px w-12 bg-[var(--line-strong)]/34" aria-hidden="true" />
            <span>刊首阅读页 / Editorial Opening</span>
          </div>
        </div>

        <div className="rounded-[4px] border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <p className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--accent-text)]">Reading Note</p>
            <p className="text-[0.75rem] tracking-[0.06em] text-[var(--accent-text)]">
              {visiblePageNumbers.length > 1 ? `Current Pages · ${stageSummary}` : `Current Page · ${stageSummary}`}
            </p>
          </div>
          <BilingualText
            as="p"
            text={note}
            className="mt-4 text-[0.9375rem] leading-7 text-[var(--muted)]"
            zhClassName="block"
            enClassName="mt-2 block text-[0.8125rem] tracking-[0.04em] leading-[1.65] text-[var(--accent-text)]"
          />
        </div>
      </div>

      <div className="rounded-[4px] border border-[var(--line-strong)] bg-[var(--surface)] p-4 md:p-5 lg:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--line)] pb-4 text-[0.75rem] tracking-[0.06em] text-[var(--accent-text)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              {`第 ${currentLabel} 页 / 共 ${totalPages} 页`}
            </span>
            <span className="h-px w-6 bg-[var(--line-strong)]/26" aria-hidden="true" />
            <span>当前展开 / {stageSummary}</span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[48px_minmax(0,1fr)_48px] lg:items-center">
          <NavigationButton
            direction="previous"
            disabled={!canGoPrevious}
            onClick={goPrevious}
          />

          <div
            tabIndex={0}
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
              if (touchStartX.current === null) {
                return;
              }

              const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
              const delta = endX - touchStartX.current;
              touchStartX.current = null;

              if (Math.abs(delta) < 28) {
                return;
              }

              if (delta > 0) {
                goPrevious();
              } else {
                goNext();
              }
            }}
            className="touch-pan-y select-none outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <div
              className={`relative grid gap-2 overflow-hidden rounded-[4px] border border-[var(--line)] bg-[var(--surface-strong)] p-2 md:p-3 ${
                usesDesktopPairing ? "lg:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {usesDesktopPairing ? (
                <div className="pointer-events-none absolute inset-y-8 left-1/2 hidden w-px -translate-x-1/2 bg-[var(--line-strong)]/48 lg:block" />
              ) : null}
              {visiblePages.map((page, index) => (
                <CataloguePage
                  key={`slot-${index}`}
                  page={page}
                  pageNumber={currentIndex + index + 1}
                  title={title}
                  side={usesDesktopPairing ? (index === 0 ? "left" : "right") : "single"}
                  displayMode={showsSpreadImage ? "spread" : "page"}
                  isMobilePortrait={isMobilePortrait}
                />
              ))}
            </div>
          </div>

          <NavigationButton
            direction="next"
            disabled={!canGoNext}
            onClick={goNext}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-[4px] border border-[var(--line)] bg-[var(--surface)] p-3 md:p-4">
          <div className="mb-3 flex flex-col gap-2 border-b border-[var(--line)]/52 pb-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.75rem] tracking-[0.08em] text-[var(--accent-text)]">图版索引 / PLATE INDEX</p>
            </div>
            <p className="text-[0.75rem] tracking-[0.06em] text-[var(--accent-text)]">
              当前浏览 / Page {stageSummary}
            </p>
          </div>

          <div>
            <div ref={thumbnailStripRef} className="flex gap-2 overflow-x-auto pb-1">
              {cataloguePages.map((page, index) => {
                const selected = usesDesktopPairing
                  ? currentIndex === getDesktopStartIndex(index, totalPages)
                  : currentIndex === index;
                const showThumbnail = thumbnailImageIndexes.has(index);

                return (
                  <button
                    key={`${page}-${index}`}
                    ref={selected ? selectedThumbnailRef : null}
                    type="button"
                    onClick={() => jumpTo(index)}
                    aria-label={`${title.zh || title.en} page ${index + 1}`}
                    aria-current={selected ? "page" : undefined}
                    className="group relative shrink-0 rounded-[2px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <div className={`overflow-hidden rounded-[2px] border p-1.5 transition-colors duration-150 ${
                      selected
                        ? "border-[var(--line-strong)] bg-[var(--surface-strong)]"
                        : "border-[var(--line)] bg-transparent hover:border-[var(--line-strong)]"
                    }`}>
                      <div className={`relative overflow-hidden rounded-[1px] bg-[var(--surface-strong)] ${
                        showsSpreadImage ? "h-20 w-32 md:h-24 md:w-40" : "h-24 w-16 md:h-28 md:w-20"
                      }`}>
                        {showThumbnail ? (
                          <ProtectedImage
                            src={page}
                            alt={`${title.zh || title.en} page ${index + 1}`}
                            fill
                            sizes={showsSpreadImage ? "160px" : "80px"}
                            wrapperClassName="h-full w-full"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center font-serif text-[1.1rem] text-[var(--accent-text)]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between px-0.5 text-[0.75rem] tracking-[0.04em] text-[var(--accent-text)]">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span>{selected ? "Current" : showsSpreadImage ? "Spread" : "Plate"}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CataloguePage({
  page,
  pageNumber,
  title,
  side,
  displayMode,
  isMobilePortrait,
}: {
  page: string | null;
  pageNumber: number;
  title: BilingualValue;
  side: "left" | "right" | "single";
  displayMode: "page" | "spread";
  isMobilePortrait: boolean;
}) {
  const compactMobileSpread = isMobilePortrait && displayMode === "spread";
  const minHeightClass = compactMobileSpread ? "min-h-0" : "min-h-[420px]";

  if (!page) {
    return (
      <div className={`relative hidden ${minHeightClass} rounded-[2px] border border-[var(--line)] bg-[var(--surface)] lg:block`}>
        <div className={`absolute inset-y-10 ${side === "right" ? "left-0" : "right-0"} w-px bg-[var(--line)]/26`} />
      </div>
    );
  }

  return (
    <div className={`group relative ${minHeightClass} rounded-[2px] border border-[var(--line)] bg-[var(--surface)] p-2 md:p-3`}>
      <div className={`absolute inset-y-8 hidden w-px bg-[var(--line)]/24 lg:block ${side === "right" ? "left-0" : side === "left" ? "right-0" : "left-0"}`} />
      <div className="relative overflow-hidden rounded-[1px] border border-[var(--line)] bg-[var(--surface)]">
        <div className={`relative bg-[var(--surface)] ${displayMode === "spread" ? "aspect-[1.7/1]" : "aspect-[0.72/1]"}`}>
          <ProtectedImage
            src={page}
            alt={`${title.zh || title.en} page ${pageNumber}`}
            fill
            sizes={displayMode === "spread" ? "(min-width: 1024px) 84vw, 92vw" : "(min-width: 1024px) 42vw, 88vw"}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            wrapperClassName="h-full w-full"
            className="object-contain"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[0.75rem] uppercase tracking-[0.06em] text-[var(--accent-text)]">
        <span>{pageNumber.toString().padStart(2, "0")}</span>
        <span>{displayMode === "spread" ? "Spread" : side === "single" ? "Reader" : "Catalogue"}</span>
      </div>
    </div>
  );
}

function NavigationButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const label = direction === "previous" ? "上一页 Prev" : "下一页 Next";
  const symbol = direction === "previous" ? "←" : "→";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center rounded-[2px] border border-[var(--line)] bg-transparent px-4 text-[var(--ink)] transition-colors duration-150 hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-30 lg:min-h-[144px] lg:w-[48px] lg:px-0"
      aria-label={label}
    >
      <span className="text-[1.1rem]" aria-hidden="true">
        {symbol}
      </span>
    </button>
  );
}
