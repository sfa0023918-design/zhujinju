"use client";

import { useEffect, useRef, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";

type ExpandableBilingualCopyProps = {
  text: BilingualValue | BilingualValue[];
  collapsedClassName?: string;
  zhClassName?: string;
  enClassName?: string;
};

function toItems(text: BilingualValue | BilingualValue[]) {
  return Array.isArray(text) ? text.filter(Boolean) : [text];
}

export function ExpandableBilingualCopy({
  text,
  collapsedClassName = "max-h-[18rem] md:max-h-[22rem]",
  zhClassName = "text-[0.94rem] leading-7 text-[var(--muted)]",
  enClassName = "text-[0.82rem] leading-6 text-[var(--muted)]/82",
}: ExpandableBilingualCopyProps) {
  const items = toItems(text);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;

    if (!outer || !inner) {
      return;
    }

    const measure = () => {
      const nextCanExpand = inner.scrollHeight - outer.clientHeight > 8;
      setCanExpand(nextCanExpand);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items, expanded]);

  return (
    <div className="space-y-3">
      <div
        ref={outerRef}
        className={`relative overflow-hidden transition-[max-height] duration-300 ease-out ${
          expanded ? "max-h-[999rem]" : collapsedClassName
        }`}
      >
        <div ref={innerRef} className="space-y-5 md:space-y-6">
          {items.map((item, index) => (
            <div key={`copy-${index}`} className="space-y-2.5">
              {item.zh.trim() ? (
                <p lang="zh-CN" className={zhClassName}>
                  {item.zh}
                </p>
              ) : null}
              {item.en.trim() ? (
                <p lang="en" className={enClassName}>
                  {item.en}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        {canExpand && !expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg)] via-[rgba(244,240,232,0.9)] to-transparent" />
        ) : null}
      </div>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex items-center gap-1.5 text-[0.82rem] leading-6 tracking-[0.02em] text-[var(--accent)]/92 transition-colors hover:text-[var(--ink)]"
        >
          {expanded ? "收起" : "查看更多"}
          <span aria-hidden="true">{expanded ? "∧" : "∨"}</span>
        </button>
      ) : null}
    </div>
  );
}
