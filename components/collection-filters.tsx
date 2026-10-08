"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";

import { bt } from "@/lib/bilingual";
import type { CollectionFacets } from "@/lib/collection-facets";
import { buildCollectionHref, COLLECTION_FILTER_KEYS } from "@/lib/collection-filtering";
import type { CollectionFilterKey } from "@/lib/collection-filtering";
import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";
import styles from "./collection-page.module.css";

type CollectionFiltersProps = {
  current: {
    category?: string;
    region?: string;
    period?: string;
    material?: string;
    status?: string;
  };
  options: {
    all: BilingualValue;
    facets: CollectionFacets;
  };
  labels: {
    category: BilingualValue;
    region: BilingualValue;
    period: BilingualValue;
    material: BilingualValue;
    status: BilingualValue;
    actions: BilingualValue;
    apply: BilingualValue;
    reset: BilingualValue;
  };
  resultCount: number;
  // When provided, plain clicks update the address in place instead of asking the
  // server for a new page. Modified clicks (new tab, etc.) keep the normal link.
  onNavigate?: (href: string) => void;
};

type FilterKey = CollectionFilterKey;

function buildFilterHref(
  current: CollectionFiltersProps["current"],
  fieldName: FilterKey,
  nextValue?: string,
) {
  return buildCollectionHref({ ...current, [fieldName]: nextValue });
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function FilterBilingualPair({
  text,
  className = "",
}: {
  text: BilingualValue;
  className?: string;
}) {
  return (
    <BilingualText
      as="span"
      text={text}
      className={`${styles.bilingualPair} ${className}`}
      zhClassName={styles.zh}
      enClassName={styles.en}
    />
  );
}

export function CollectionFilters({
  current,
  options,
  labels,
  resultCount,
  onNavigate,
}: CollectionFiltersProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);
  const resultCountLabel = bt(`${resultCount} 件作品`, `${resultCount} works`);

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleFilterLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    cancelClose();
    setOpenKey(null);

    if (onNavigate && isPlainLeftClick(event)) {
      event.preventDefault();
      onNavigate(href);
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenKey(null);
      closeTimerRef.current = null;
    }, 170);
  };

  const filterFields = useMemo(
    () =>
      COLLECTION_FILTER_KEYS.map((name) => ({
        name,
        label: labels[name],
        total: options.facets[name].total,
        options: options.facets[name].options,
      })),
    [labels, options],
  );

  useEffect(() => {
    setOpenKey(null);
  }, [current.category, current.region, current.period, current.material, current.status]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        cancelClose();
        setOpenKey(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelClose();
        setOpenKey(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      cancelClose();
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.filterFrame}>
      <div className={styles.filters}>
        {filterFields.map((field) => {
          const currentLabel =
            field.options.find((option) => option.value === current[field.name])?.label ?? options.all;
          const isOpen = openKey === field.name;

          return (
            <div
              key={field.name}
              className={styles.filterControl}
              onMouseEnter={cancelClose}
              onMouseLeave={() => {
                if (isOpen) {
                  scheduleClose();
                }
              }}
            >
              <button
                type="button"
                className={styles.filterTrigger}
                aria-expanded={isOpen}
                onClick={() => {
                  cancelClose();
                  setOpenKey((previous) => (previous === field.name ? null : field.name));
                }}
              >
                <FilterBilingualPair text={field.label} className={styles.filterLabel} />
                <FilterBilingualPair text={currentLabel} className={styles.filterValue} />
              </button>

              {isOpen ? (
                <div className={styles.filterMenu}>
                  <Link
                    href={buildFilterHref(current, field.name)}
                    aria-current={!current[field.name] ? "true" : undefined}
                    onClick={(event) => handleFilterLinkClick(event, buildFilterHref(current, field.name))}
                  >
                    <FilterBilingualPair text={options.all} />
                    <span className={styles.filterCount}>{field.total}</span>
                  </Link>
                  {field.options.map((option) => (
                    <Link
                      key={`${field.name}-${option.value}`}
                      href={buildFilterHref(current, field.name, option.value)}
                      aria-current={current[field.name] === option.value ? "true" : undefined}
                      onClick={(event) =>
                        handleFilterLinkClick(event, buildFilterHref(current, field.name, option.value))
                      }
                    >
                      <FilterBilingualPair text={option.label} />
                      <span className={styles.filterCount}>{option.count}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={styles.filterSummary}>
        <FilterBilingualPair text={resultCountLabel} />
        <Link href="/collection" onClick={(event) => handleFilterLinkClick(event, "/collection")}>
          <FilterBilingualPair text={labels.reset} />
        </Link>
      </div>
    </div>
  );
}
