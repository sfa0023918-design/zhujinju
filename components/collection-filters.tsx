"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { bt } from "@/lib/bilingual";
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
    categories: BilingualValue[];
    regions: BilingualValue[];
    periods: BilingualValue[];
    materials: BilingualValue[];
    statuses: Array<{ value: string; label: BilingualValue }>;
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
};

const filterKeys = ["category", "region", "period", "material", "status"] as const;
type FilterKey = (typeof filterKeys)[number];
type FilterOption = {
  value?: string;
  label: BilingualValue;
};

function getPeriodStartCentury(option: BilingualValue) {
  const source = `${option.zh} ${option.en}`;
  const match = source.match(/(\d{1,2})/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function buildFilterHref(
  current: CollectionFiltersProps["current"],
  fieldName: FilterKey,
  nextValue?: string,
) {
  const params = new URLSearchParams();

  filterKeys.forEach((key) => {
    const value = key === fieldName ? nextValue : current[key];

    if (value && value !== "全部") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/collection?${query}` : "/collection";
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

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenKey(null);
      closeTimerRef.current = null;
    }, 170);
  };

  const filterFields = useMemo(
    () =>
      [
        {
          name: "category" as const,
          label: labels.category,
          options: options.categories.map((item) => ({ value: item.zh, label: item })),
        },
        {
          name: "region" as const,
          label: labels.region,
          options: options.regions.map((item) => ({ value: item.zh, label: item })),
        },
        {
          name: "period" as const,
          label: labels.period,
          options: [...options.periods]
            .sort((left, right) => getPeriodStartCentury(left) - getPeriodStartCentury(right))
            .map((item) => ({ value: item.zh, label: item })),
        },
        {
          name: "material" as const,
          label: labels.material,
          options: options.materials.map((item) => ({ value: item.zh, label: item })),
        },
        {
          name: "status" as const,
          label: labels.status,
          options: options.statuses.map((item) => ({ value: item.value, label: item.label })),
        },
      ] satisfies Array<{ name: FilterKey; label: BilingualValue; options: FilterOption[] }>,
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
                    onClick={() => {
                      cancelClose();
                      setOpenKey(null);
                    }}
                  >
                    <FilterBilingualPair text={options.all} />
                  </Link>
                  {field.options.map((option) => (
                    <Link
                      key={`${field.name}-${option.value ?? "all"}`}
                      href={buildFilterHref(current, field.name, option.value)}
                      aria-current={current[field.name] === option.value ? "true" : undefined}
                      onClick={() => {
                        cancelClose();
                        setOpenKey(null);
                      }}
                    >
                      <FilterBilingualPair text={option.label} />
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
        <Link href="/collection">
          <FilterBilingualPair text={labels.reset} />
        </Link>
      </div>
    </div>
  );
}
