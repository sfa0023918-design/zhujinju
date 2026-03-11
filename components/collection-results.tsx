"use client";
import { useEffect, useMemo, useRef, useState } from "react";

import type { Artwork } from "@/lib/site-data";

import { ArtworkCard } from "./artwork-card";

const DESKTOP_PAGE_SIZE = 9;
const TABLET_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 4;

function getPageSize(width: number) {
  if (width >= 1280) {
    return DESKTOP_PAGE_SIZE;
  }

  if (width >= 768) {
    return TABLET_PAGE_SIZE;
  }

  return MOBILE_PAGE_SIZE;
}

type CollectionResultsProps = {
  artworks: Artwork[];
};

export function CollectionResults({ artworks }: CollectionResultsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(1);
  const [pageSize, setPageSize] = useState(DESKTOP_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const updatePageSize = () => {
      setPageSize(getPageSize(window.innerWidth));
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => {
      window.removeEventListener("resize", updatePageSize);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [artworks]);

  const totalPages = Math.max(1, Math.ceil(artworks.length / pageSize));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return artworks.slice(startIndex, startIndex + pageSize);
  }, [artworks, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage === previousPageRef.current) {
      return;
    }

    previousPageRef.current = currentPage;
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  return (
    <div ref={rootRef}>
      <div className="grid gap-x-8 gap-y-11 md:grid-cols-2 xl:grid-cols-3">
        {currentItems.map((artwork, index) => (
          <ArtworkCard
            key={artwork.slug}
            artwork={artwork}
            priority={currentPage === 1 && index < 3}
            variant="catalogue"
          />
        ))}
      </div>

      {artworks.length > pageSize ? (
        <div className="mt-12 border-t border-[var(--line)]/55 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.76rem] leading-7 text-[var(--muted)]/86">
              第 {currentPage} 页，共 {totalPages} 页
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {currentPage > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="inline-flex min-h-[2.2rem] cursor-pointer select-none items-center rounded-full border border-[var(--line)]/55 px-3.5 py-[0.42rem] text-[0.72rem] text-[var(--muted)] transition-colors duration-150 hover:border-[var(--line-strong)]/46 hover:text-[var(--ink)]"
                >
                  上一页
                </button>
              ) : null}

              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                  const isCurrent = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      aria-current={isCurrent ? "page" : undefined}
                      onClick={() => setCurrentPage(page)}
                      className={`inline-flex min-h-[2.2rem] min-w-[2.2rem] cursor-pointer select-none items-center justify-center rounded-full border px-3 py-[0.42rem] text-[0.72rem] transition-colors duration-150 ${
                        isCurrent
                          ? "border-[var(--line-strong)]/55 text-[var(--ink)]"
                          : "border-[var(--line)]/45 text-[var(--muted)] hover:border-[var(--line-strong)]/42 hover:text-[var(--ink)]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              {currentPage < totalPages ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  className="inline-flex min-h-[2.2rem] cursor-pointer select-none items-center rounded-full border border-[var(--line)]/55 px-3.5 py-[0.42rem] text-[0.72rem] text-[var(--muted)] transition-colors duration-150 hover:border-[var(--line-strong)]/46 hover:text-[var(--ink)]"
                >
                  下一页
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
