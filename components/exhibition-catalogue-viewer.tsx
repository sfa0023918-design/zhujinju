"use client";

import { useEffect, useRef, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";
import { ProtectedImage } from "./protected-image";

const DESKTOP_BREAKPOINT = "(min-width: 1024px)";
const MOBILE_PORTRAIT_BREAKPOINT = "(max-width: 767px) and (orientation: portrait)";

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
  const cataloguePages = pages.filter(Boolean);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const totalPages = cataloguePages.length;
  const showsSpreadImage = viewMode === "spread-images";
  const usesDesktopPairing = isDesktop && !showsSpreadImage;

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);

    function updateLayout() {
      setIsDesktop(mediaQuery.matches);
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
    <div className="space-y-8">
      <div className="grid gap-6 border-b border-[var(--line)]/68 pb-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)] lg:items-end">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.68rem] tracking-[0.22em] text-[var(--accent)]/74">
            <span>电子图录 / DIGITAL CATALOGUE</span>
            <span className="h-px w-8 bg-[var(--line-strong)]/28" aria-hidden="true" />
            <span>{`Page Count · ${totalPages}`}</span>
            <span className="h-px w-8 bg-[var(--line-strong)]/28" aria-hidden="true" />
            <span>{readingModeLabel}</span>
          </div>
          <BilingualText
            as="h2"
            text={title}
            className="font-serif text-[var(--ink)]"
            zhClassName="block max-w-[11ch] text-[2rem] leading-[1.03] tracking-[-0.05em] md:text-[2.82rem]"
            enClassName="mt-3 block text-[0.64rem] uppercase tracking-[0.24em] text-[var(--accent)]/68"
          />
          <div className="flex items-center gap-3 text-[0.72rem] tracking-[0.16em] text-[var(--accent)]/72">
            <span className="h-px w-12 bg-[var(--line-strong)]/34" aria-hidden="true" />
            <span>刊首阅读页 · Editorial Opening</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[26px] border border-[var(--line)]/72 bg-[linear-gradient(155deg,rgba(255,255,255,0.78),rgba(243,235,225,0.96))] p-5 shadow-[0_16px_40px_rgba(32,24,17,0.06)]">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-16 rounded-full bg-white/54 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3 border-b border-[var(--line)]/56 pb-3">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--accent)]/68">Reading Note</p>
            <p className="text-[0.68rem] tracking-[0.18em] text-[var(--accent)]/68">
              {visiblePageNumbers.length > 1 ? `Current Pages · ${stageSummary}` : `Current Page · ${stageSummary}`}
            </p>
          </div>
          <BilingualText
            as="p"
            text={note}
            className="relative mt-4 text-[0.92rem] leading-7 text-[var(--muted)]"
            zhClassName="block"
            enClassName="mt-2 block text-[0.6rem] uppercase tracking-[0.14em] leading-6 text-[var(--accent)]/70"
          />
          <div className="relative mt-4 grid gap-3 border-t border-[var(--line)]/56 pt-3 text-[0.69rem] text-[var(--accent)]/76 md:grid-cols-3">
            <EditorialFact label="导航" value="Arrow keys" />
            <EditorialFact label="手势" value="Swipe to turn" />
            <EditorialFact label="索引" value="Page index" />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[34px] border border-[#d8cab8] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),rgba(244,236,226,0.965)_42%,rgba(234,223,209,0.985)_100%)] p-4 shadow-[0_34px_84px_rgba(33,25,18,0.1)] md:p-5 lg:p-7">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-white/58 blur-3xl" />
        <div className="pointer-events-none absolute inset-3 rounded-[28px] border border-white/32" />

        <div className="relative mb-5 flex flex-col gap-3 border-b border-[var(--line)]/62 pb-4 text-[0.72rem] tracking-[0.18em] text-[var(--accent)]/82 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              {`第 ${currentLabel} 页 / 共 ${totalPages} 页`}
            </span>
            <span className="h-px w-6 bg-[var(--line-strong)]/26" aria-hidden="true" />
            <span>当前展开 / {stageSummary}</span>
          </div>
          <span>翻阅图录请横向浏览 / Swipe or click to turn pages</span>
        </div>

        <div className="relative grid gap-4 lg:grid-cols-[58px_minmax(0,1fr)_58px] lg:items-center">
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

              if (Math.abs(delta) < 44) {
                return;
              }

              if (delta > 0) {
                goPrevious();
              } else {
                goNext();
              }
            }}
            className="relative outline-none"
          >
            <div className="pointer-events-none absolute inset-x-[11%] -bottom-3 h-12 rounded-full bg-[rgba(93,71,45,0.08)] blur-2xl" />
            <div
              key={`${usesDesktopPairing ? "spread" : "single"}-${currentIndex}`}
              className={`relative grid gap-2 overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,#e7d9c7_0%,#e0cfbb_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_24px_72px_rgba(35,24,16,0.14)] md:p-4 ${
                usesDesktopPairing ? "lg:grid-cols-2" : "grid-cols-1"
              } site-fade-in`}
            >
              <div className="pointer-events-none absolute inset-x-5 top-3 h-8 rounded-full bg-white/22 blur-2xl" />
              {usesDesktopPairing ? (
                <div className="pointer-events-none absolute inset-y-10 left-1/2 hidden w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(115,86,58,0.15),rgba(79,57,37,0.38),rgba(115,86,58,0.15))] lg:block" />
              ) : null}
              {visiblePages.map((page, index) => (
                <CataloguePage
                  key={`${currentIndex}-${index}-${page ?? "blank"}`}
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

        <div className="relative mt-6 overflow-hidden rounded-[24px] border border-[var(--line)]/64 bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(246,240,232,0.74))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] md:p-4">
          <div className="mb-3 flex flex-col gap-2 border-b border-[var(--line)]/52 pb-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[0.72rem] tracking-[0.2em] text-[var(--accent)]">图版索引 · PLATE INDEX</p>
              <p className="mt-1 text-[0.8rem] text-[var(--muted)]">点击缩略图可快速跳转到任意页</p>
            </div>
            <p className="text-[0.74rem] tracking-[0.14em] text-[var(--accent)]/78">
              当前浏览 / Page {stageSummary}
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-[linear-gradient(90deg,rgba(242,236,227,0.96),rgba(242,236,227,0))]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-[linear-gradient(270deg,rgba(242,236,227,0.96),rgba(242,236,227,0))]" />
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {cataloguePages.map((page, index) => {
                const selected = usesDesktopPairing
                  ? currentIndex === getDesktopStartIndex(index, totalPages)
                  : currentIndex === index;

                return (
                  <button
                    key={`${page}-${index}`}
                    type="button"
                    onClick={() => jumpTo(index)}
                    className={`group relative shrink-0 rounded-[18px] transition-all duration-300 ${
                      selected
                        ? "-translate-y-1"
                        : "hover:-translate-y-0.5"
                    }`}
                  >
                    <div className={`overflow-hidden rounded-[18px] border p-1.5 transition-all duration-300 ${
                      selected
                        ? "border-[var(--line-strong)] bg-white shadow-[0_14px_28px_rgba(30,22,16,0.14)]"
                        : "border-[var(--line)]/70 bg-white/7 hover:border-[var(--line-strong)]/68 hover:bg-white/66"
                    }`}>
                      <div className={`mb-1.5 h-px transition-colors ${selected ? "bg-[var(--line-strong)]/74" : "bg-[var(--line)]/42 group-hover:bg-[var(--line-strong)]/48"}`} />
                      <div className={`relative overflow-hidden rounded-[13px] bg-[#f7f2ea] ${
                        showsSpreadImage ? "h-20 w-32 md:h-24 md:w-40" : "h-24 w-16 md:h-28 md:w-20"
                      }`}>
                        <ProtectedImage
                          src={page}
                          alt={`${title.zh || title.en} page ${index + 1}`}
                          fill
                          sizes={showsSpreadImage ? "160px" : "80px"}
                          wrapperClassName="h-full w-full"
                          className={`object-cover transition-transform duration-500 ${selected ? "scale-[1.015]" : "group-hover:scale-[1.03]"}`}
                        />
                        <div className={`absolute inset-0 transition-colors ${selected ? "bg-[linear-gradient(180deg,transparent,rgba(15,11,8,0.14))]" : "bg-[linear-gradient(180deg,transparent,rgba(15,11,8,0.24))]"}`} />
                      </div>
                      <div className="mt-2 flex items-center justify-between px-0.5 text-[0.6rem] tracking-[0.18em] text-[var(--accent)]/78">
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
      <div className={`relative hidden ${minHeightClass} rounded-[24px] border border-white/55 bg-[linear-gradient(180deg,#f3eadc,#ede0ce)] lg:block`}>
        <div className={`absolute inset-y-10 ${side === "right" ? "left-0" : "right-0"} w-px bg-[var(--line)]/26`} />
      </div>
    );
  }

  return (
    <div className={`group relative ${minHeightClass} rounded-[24px] border border-white/72 bg-[linear-gradient(180deg,#f8f4ec,#f4ede2)] p-3 shadow-[0_18px_38px_rgba(32,23,17,0.075)] md:p-4`}>
      <div className={`absolute inset-y-8 hidden w-px bg-[var(--line)]/24 lg:block ${side === "right" ? "left-0" : side === "left" ? "right-0" : "left-0"}`} />
      <div className={`pointer-events-none absolute inset-y-4 w-10 blur-2xl ${side === "left" ? "right-0 bg-[rgba(121,92,62,0.07)]" : side === "right" ? "left-0 bg-[rgba(121,92,62,0.07)]" : "right-0 bg-[rgba(121,92,62,0.05)]"}`} />
      <div className="relative overflow-hidden rounded-[18px] bg-white shadow-[inset_0_0_0_1px_rgba(23,21,18,0.06)]">
        <div className={`relative bg-[#f8f4ec] ${displayMode === "spread" ? "aspect-[1.7/1]" : "aspect-[0.72/1]"}`}>
          <ProtectedImage
            src={page}
            alt={`${title.zh || title.en} page ${pageNumber}`}
            fill
            sizes={displayMode === "spread" ? "(min-width: 1024px) 84vw, 92vw" : "(min-width: 1024px) 42vw, 88vw"}
            wrapperClassName="h-full w-full"
            className="object-contain transition-transform duration-700 group-hover:scale-[1.005]"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[0.68rem] uppercase tracking-[0.16em] text-[var(--accent)]/72">
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
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)]/72 bg-[rgba(255,255,255,0.66)] px-4 text-[0.66rem] tracking-[0.18em] text-[var(--ink)] shadow-[0_8px_18px_rgba(28,21,16,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--line-strong)]/82 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 lg:min-h-[172px] lg:w-[56px] lg:flex-col lg:gap-2 lg:rounded-[22px] lg:px-0"
      aria-label={label}
    >
      <span className="text-[1rem]" aria-hidden="true">
        {symbol}
      </span>
      <span className="leading-5 text-center">{label}</span>
    </button>
  );
}

function EditorialFact({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[var(--accent)]/58">{label}</p>
      <p className="text-[0.72rem] tracking-[0.16em] text-[var(--accent)]/82">{value}</p>
    </div>
  );
}
