"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SetStateAction,
} from "react";

import type { CollectingDirection, OperationalFact } from "@/lib/data/types";

type CollectingDirectionsGridProps = {
  items: CollectingDirection[];
};

type OperationalFactsGridProps = {
  items: OperationalFact[];
};

type RevealBlockProps = {
  id: string;
  expanded: boolean;
  children: React.ReactNode;
  paddingClassName: string;
};

function handleCardKeyToggle(
  event: KeyboardEvent<HTMLButtonElement>,
  onToggle: () => void
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onToggle();
  }
}

function isDesktopRevealMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(min-width: 1280px)").matches &&
    window.matchMedia("(hover: hover)").matches
  );
}

function buildExpandHandlers(
  index: number,
  expandedIndex: number | null,
  setExpandedIndex: Dispatch<SetStateAction<number | null>>
) {
  return {
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (isDesktopRevealMode()) {
        event.preventDefault();
        return;
      }

      setExpandedIndex(expandedIndex === index ? null : index);
    },
    onMouseEnter: () => {
      if (isDesktopRevealMode()) {
        setExpandedIndex(index);
      }
    },
    onMouseLeave: () => {
      if (isDesktopRevealMode()) {
        setExpandedIndex((current) => (current === index ? null : current));
      }
    },
    onFocus: () => {
      setExpandedIndex(index);
    },
    onBlur: (event: FocusEvent<HTMLButtonElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setExpandedIndex((current) => (current === index ? null : current));
      }
    },
  };
}

function RevealBlock({ id, expanded, children, paddingClassName }: RevealBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    if (!expanded) {
      setMaxHeight(0);
      return;
    }

    setMaxHeight(contentRef.current.scrollHeight);
  }, [expanded, children]);

  return (
    <div
      id={id}
      className={`overflow-hidden transition-[max-height,opacity,transform,padding-top] duration-200 ease-out ${
        expanded ? `translate-y-0 pt-3 opacity-100 ${paddingClassName}` : "max-h-0 translate-y-1 pt-0 opacity-0"
      }`}
      style={expanded ? { maxHeight: `${maxHeight}px` } : { maxHeight: "0px" }}
    >
      <div ref={contentRef} className="min-h-0">
        {children}
      </div>
    </div>
  );
}

export function CollectingDirectionsGrid({ items }: CollectingDirectionsGridProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:items-start">
      {items.map((direction, index) => {
        const isExpanded = expandedIndex === index;
        const detailId = `collecting-direction-detail-${index}`;
        const handlers = buildExpandHandlers(index, expandedIndex, setExpandedIndex);

        return (
          <button
            key={`${direction.name.zh}-${index}`}
            type="button"
            aria-expanded={isExpanded}
            aria-controls={detailId}
            {...handlers}
            onKeyDown={(event) =>
              handleCardKeyToggle(event, () => setExpandedIndex(isExpanded ? null : index))
            }
            className="group flex min-h-[84px] w-full flex-col justify-start border-b border-[var(--line)] px-1 pb-3 pt-2 text-left transition-[border-color,opacity,transform,max-height] duration-200 ease-out focus:outline-none"
          >
            <p className="text-[15px] font-[450] leading-[1.45] text-[var(--ink)]">
              {direction.name.zh}
            </p>
            <p className="pt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent)]/54">
              {direction.name.en}
            </p>
            {(direction.description.zh || direction.description.en) ? (
              <RevealBlock id={detailId} expanded={isExpanded} paddingClassName="">
                <div className="space-y-1 border-t border-[var(--line)]/40 pt-2.5">
                  {direction.description.zh ? (
                    <p className="text-[13px] leading-[1.65] text-[var(--muted)]/92">
                      {direction.description.zh}
                    </p>
                  ) : null}
                  {direction.description.en ? (
                    <p className="text-[11px] leading-[1.58] text-[var(--accent)]/76">
                      {direction.description.en}
                    </p>
                  ) : null}
                </div>
              </RevealBlock>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function OperationalFactsGrid({ items }: OperationalFactsGridProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="border-y border-[var(--line)] md:grid md:grid-cols-2 md:divide-x md:divide-[var(--line)] md:items-start lg:grid-cols-3 xl:grid-cols-5">
      {items.map((pillar, index) => {
        const isExpanded = expandedIndex === index;
        const detailId = `operational-fact-detail-${index}`;
        const hasDenseValue =
          pillar.title.zh === "服务对象" || pillar.title.zh.includes("预约制空间");
        const handlers = buildExpandHandlers(index, expandedIndex, setExpandedIndex);

        return (
          <button
            key={`${pillar.title.zh}-${index}`}
            type="button"
            aria-expanded={isExpanded}
            aria-controls={detailId}
            {...handlers}
            onKeyDown={(event) =>
              handleCardKeyToggle(event, () => setExpandedIndex(isExpanded ? null : index))
            }
            className="group flex min-h-[140px] w-full flex-col border-t border-[var(--line)] px-3 py-4 text-left transition-[border-color,opacity,transform,max-height] duration-200 ease-out first:border-t-0 focus:outline-none md:border-t-0 md:px-4"
          >
            <p className="text-[0.66rem] tracking-[0.14em] text-[var(--accent)]/78">
              {pillar.title.zh}
            </p>
            <p
              className={
                hasDenseValue
                  ? "mt-2.5 text-[15px] font-[450] leading-[1.72] text-[var(--muted)]"
                  : "mt-2.5 font-serif text-[1.34rem] leading-[1.06] tracking-[-0.028em] text-[var(--ink)]"
              }
            >
              {pillar.value.zh}
            </p>
            <div className="mt-2 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent)]/56">
                {pillar.title.en}
              </p>
              {pillar.value.en ? (
                <p
                  className={
                    hasDenseValue
                      ? "text-[12px] leading-[1.55] text-[var(--accent)]/82"
                      : "text-[13px] leading-[1.5] text-[var(--accent)]/88"
                  }
                >
                  {pillar.value.en}
                </p>
              ) : null}
            </div>
            {(pillar.description.zh || pillar.description.en) ? (
              <RevealBlock id={detailId} expanded={isExpanded} paddingClassName="">
                <div className="space-y-1 border-t border-[var(--line)]/40 pt-2.5">
                  {pillar.description.zh ? (
                    <p className="text-[13px] leading-[1.68] text-[var(--muted)]/92">
                      {pillar.description.zh}
                    </p>
                  ) : null}
                  {pillar.description.en ? (
                    <p className="text-[11px] leading-[1.58] text-[var(--accent)]/76">
                      {pillar.description.en}
                    </p>
                  ) : null}
                </div>
              </RevealBlock>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
