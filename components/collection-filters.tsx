"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";

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

export function CollectionFilters({
  current,
  options,
  labels,
  resultCount,
}: CollectionFiltersProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);

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
    <div ref={rootRef} className="border-y border-[var(--line)]/50 py-3 md:py-3">
      <div className="hidden items-center gap-2 md:flex md:flex-wrap md:gap-2.5">
        {filterFields.map((field) => {
          const currentLabel =
            field.options.find((option) => option.value === current[field.name])?.label ?? options.all;
          const isOpen = openKey === field.name;
          const isActive = Boolean(current[field.name]);

          return (
            <div
              key={field.name}
              className="relative min-w-0"
              onMouseEnter={cancelClose}
              onMouseLeave={() => {
                if (isOpen) {
                  scheduleClose();
                }
              }}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  cancelClose();
                  setOpenKey((previous) => (previous === field.name ? null : field.name));
                }}
                className={`inline-flex min-h-[2rem] w-full cursor-pointer select-none items-center gap-2 rounded-full border px-3 py-[0.32rem] text-left transition-colors duration-150 md:min-w-[138px] ${
                  isOpen || isActive
                    ? "border-[var(--line-strong)]/62 bg-[rgba(230,224,214,0.42)] text-[var(--ink)]"
                    : "border-[var(--line)]/52 text-[var(--muted)] hover:border-[var(--line-strong)]/42 hover:text-[var(--ink)]"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <BilingualText
                    as="span"
                    text={field.label}
                    mode="inline"
                    className="block text-[var(--accent)]"
                    zhClassName="text-[0.5rem] tracking-[0.12em]"
                    enClassName="text-[0.38rem] uppercase tracking-[0.13em] text-[var(--accent)]/82"
                  />
                  <BilingualText
                    as="span"
                    text={currentLabel}
                    mode="inline"
                    className="mt-[0.18rem] block truncate text-[var(--ink)]"
                    zhClassName={isOpen || isActive ? "text-[0.72rem] text-[var(--ink)]" : "text-[0.72rem]"}
                    enClassName={
                      isOpen || isActive
                        ? "text-[0.38rem] uppercase tracking-[0.13em] text-[var(--accent)]/88"
                        : "text-[0.38rem] uppercase tracking-[0.13em] text-[var(--accent)]/82"
                    }
                  />
                </div>
                <span
                  aria-hidden="true"
                  className={`text-[0.42rem] text-[var(--accent)]/28 transition-transform duration-150 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {isOpen ? (
                <div className="absolute left-0 top-[calc(100%+0.35rem)] z-20 min-w-[204px] border border-[var(--line)]/52 bg-[var(--surface)] p-[3px] shadow-[0_12px_26px_rgba(26,22,18,0.05)]">
                  <div className="grid max-h-[224px] gap-px overflow-y-auto overscroll-contain bg-[var(--line)]/10 [scrollbar-gutter:stable]">
                    <Link
                      href={buildFilterHref(current, field.name, undefined)}
                      onClick={() => {
                        cancelClose();
                        setOpenKey(null);
                      }}
                      className={`flex w-full cursor-pointer select-none items-center justify-between gap-3 bg-[var(--surface)] px-3 py-[0.46rem] text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--surface-strong)] hover:text-[var(--ink)] ${
                        !current[field.name] ? "bg-[rgba(230,224,214,0.42)] text-[var(--ink)]" : ""
                      }`}
                    >
                      <span className="text-[0.74rem]">{options.all.zh}</span>
                      <span className="text-[0.38rem] uppercase tracking-[0.13em] text-[var(--accent)]/82">
                        {options.all.en}
                      </span>
                    </Link>
                    {field.options.map((option) => (
                      <Link
                        key={`${field.name}-${option.value ?? "all"}`}
                        href={buildFilterHref(current, field.name, option.value)}
                        onClick={() => {
                          cancelClose();
                          setOpenKey(null);
                        }}
                        className={`flex w-full cursor-pointer select-none items-center justify-between gap-3 bg-[var(--surface)] px-3 py-[0.46rem] text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--surface-strong)] hover:text-[var(--ink)] ${
                          current[field.name] === option.value
                            ? "bg-[rgba(230,224,214,0.42)] text-[var(--ink)]"
                            : ""
                        }`}
                      >
                        <span className="text-[0.74rem] leading-6">{option.label.zh}</span>
                        <span className="text-[0.38rem] uppercase tracking-[0.13em] text-[var(--accent)]/82">
                          {option.label.en}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        <Link
          href="/collection"
          className="inline-flex min-h-[2rem] cursor-pointer select-none items-center rounded-full border border-[var(--line)]/52 px-2.75 py-[0.32rem] text-[var(--muted)] transition-colors duration-150 hover:border-[var(--line-strong)]/42 hover:text-[var(--ink)]"
        >
          <span className="text-[0.66rem]">{labels.reset.zh}</span>
          <span className="ml-1 text-[0.38rem] uppercase tracking-[0.14em] text-[var(--accent)]/82">
            {labels.reset.en}
          </span>
        </Link>

        <div className="md:ml-auto flex items-center">
          <span className="select-none text-[0.72rem] tracking-[0.06em] text-[var(--muted)]/82">{`${resultCount} 件作品`}</span>
        </div>
      </div>

      <div className="grid gap-2.5 md:hidden">
        <div className="grid grid-cols-2 gap-2">
          {filterFields.map((field) => {
            const currentLabel =
              field.options.find((option) => option.value === current[field.name])?.label ?? options.all;
            const isActive = Boolean(current[field.name]);
            const isOpen = openKey === field.name;

            return (
              <div
                key={field.name}
                className={`relative ${field.name === "status" ? "col-span-2" : ""}`}
                onMouseEnter={cancelClose}
                onMouseLeave={() => {
                  if (isOpen) {
                    scheduleClose();
                  }
                }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    cancelClose();
                    setOpenKey((previous) => (previous === field.name ? null : field.name));
                  }}
                  className={`inline-flex min-h-[2.15rem] w-full cursor-pointer select-none items-center justify-between gap-2 rounded-full border px-3 py-[0.35rem] ${
                    isActive || isOpen
                      ? "border-[var(--line-strong)]/62 bg-[rgba(230,224,214,0.42)] text-[var(--ink)]"
                      : "border-[var(--line)]/52 text-[var(--muted)]"
                  }`}
                >
                  <span className="text-[0.72rem]">{field.label.zh}</span>
                  <span
                    className={`text-[0.46rem] uppercase tracking-[0.14em] ${
                      isActive || isOpen ? "text-[var(--accent)]/88" : "text-[var(--accent)]/82"
                    }`}
                  >
                    {currentLabel.zh}
                  </span>
                </button>

                {isOpen ? (
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 min-w-0 w-full max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[16px] border border-[var(--line)]/60 bg-[var(--surface)] p-[3px] shadow-[0_18px_36px_rgba(17,14,12,0.1)]">
                    <div className="grid max-h-[280px] gap-px overflow-y-auto overscroll-contain bg-[var(--line)]/10 [scrollbar-gutter:stable]">
                      <Link
                        href={buildFilterHref(current, field.name, undefined)}
                        onClick={() => {
                          cancelClose();
                          setOpenKey(null);
                        }}
                          className={`flex w-full cursor-pointer select-none items-center justify-between gap-3 bg-[var(--surface)] px-3 py-[0.66rem] transition-colors duration-150 ${
                            !current[field.name]
                              ? "bg-[rgba(230,224,214,0.42)] text-[var(--ink)]"
                              : "text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
                          }`}
                      >
                        <span className="text-[0.82rem]">{options.all.zh}</span>
                        <span className="text-[0.44rem] uppercase tracking-[0.14em] text-[var(--accent)]/82">
                          {options.all.en}
                        </span>
                      </Link>
                      {field.options.map((option) => (
                        <Link
                          key={`${field.name}-${option.value ?? "all-mobile"}`}
                          href={buildFilterHref(current, field.name, option.value)}
                          onClick={() => {
                            cancelClose();
                            setOpenKey(null);
                          }}
                          className={`flex w-full cursor-pointer select-none items-center justify-between gap-3 bg-[var(--surface)] px-3 py-[0.66rem] transition-colors duration-150 ${
                            current[field.name] === option.value
                              ? "bg-[rgba(230,224,214,0.42)] text-[var(--ink)]"
                              : "text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
                          }`}
                        >
                          <span className="text-[0.82rem]">{option.label.zh}</span>
                          <span className="text-[0.44rem] uppercase tracking-[0.14em] text-[var(--accent)]/82">
                            {option.label.en}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div>
          <Link
            href="/collection"
            className="inline-flex min-h-[2rem] cursor-pointer select-none items-center rounded-full border border-[var(--line)]/52 px-2.75 py-[0.32rem] text-[var(--muted)]"
          >
            <span className="text-[0.66rem]">{labels.reset.zh}</span>
          </Link>
        </div>
        <div>
          <span className="select-none text-[0.72rem] tracking-[0.06em] text-[var(--muted)]/82">{`${resultCount} 件作品`}</span>
        </div>
      </div>

      {null}
    </div>
  );
}
