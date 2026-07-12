"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Artwork } from "@/lib/site-data";

import { ArtworkCard } from "./artwork-card";
import styles from "./collection-page.module.css";

const DESKTOP_PAGE_SIZE = 9;
const TABLET_PAGE_SIZE = 6;
const MOBILE_PAGE_SIZE = 4;
type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

function getPageSize(width: number) {
  if (width >= 1280) {
    return DESKTOP_PAGE_SIZE;
  }

  if (width >= 768) {
    return TABLET_PAGE_SIZE;
  }

  return MOBILE_PAGE_SIZE;
}

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = Array.from(
    new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]),
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const items: PaginationItem[] = [];

  pages.forEach((page, index) => {
    const previousPage = pages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push(previousPage === 1 ? "ellipsis-start" : "ellipsis-end");
    }
    items.push(page);
  });

  return items;
}

type CollectionResultsProps = {
  artworks: Artwork[];
  filterSignature: string;
};

export function CollectionResults({ artworks, filterSignature }: CollectionResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef(1);
  const [pageSize, setPageSize] = useState(MOBILE_PAGE_SIZE);
  const [pageSizeReady, setPageSizeReady] = useState(false);

  const requestedPage = useMemo(() => {
    const raw = searchParams.get("page");
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }, [searchParams]);
  const activeFilterSignature = useMemo(
    () => ["category", "region", "period", "material", "status"]
      .map((key) => searchParams.get(key) ?? "")
      .join("|"),
    [searchParams],
  );

  useEffect(() => {
    const updatePageSize = () => {
      setPageSize(getPageSize(window.innerWidth));
      setPageSizeReady(true);
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => {
      window.removeEventListener("resize", updatePageSize);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(artworks.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const paginationItems = getPaginationItems(currentPage, totalPages);

  useEffect(() => {
    if (!pageSizeReady || activeFilterSignature !== filterSignature) {
      return;
    }

    if (requestedPage === currentPage) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (currentPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(currentPage));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [
    activeFilterSignature,
    currentPage,
    filterSignature,
    pageSizeReady,
    pathname,
    requestedPage,
    router,
    searchParams,
  ]);

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

  function setCollectionPage(nextPage: number) {
    const page = Math.min(Math.max(nextPage, 1), totalPages);
    const params = new URLSearchParams(searchParams.toString());

    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div ref={rootRef} className={styles.results}>
      <div className={styles.artworksGrid}>
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
        <nav className={styles.pagination} aria-label="Collection pages">
          <p>第 {currentPage} 页，共 {totalPages} 页</p>
          <div className={styles.pageLinks}>
            <button
              type="button"
              aria-label="上一页"
              disabled={currentPage === 1}
              onClick={() => setCollectionPage(currentPage - 1)}
            >
              ←
            </button>

            {paginationItems.map((item) =>
              typeof item === "number" ? (
                <button
                  key={item}
                  type="button"
                  aria-current={item === currentPage ? "page" : undefined}
                  onClick={() => setCollectionPage(item)}
                >
                  {item}
                </button>
              ) : (
                <span key={item} className={styles.paginationEllipsis} aria-hidden="true">
                  …
                </span>
              ),
            )}

            <button
              type="button"
              aria-label="下一页"
              disabled={currentPage === totalPages}
              onClick={() => setCollectionPage(currentPage + 1)}
            >
              →
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
