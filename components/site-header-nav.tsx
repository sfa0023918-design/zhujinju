"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { BilingualText as BilingualValue } from "@/lib/site-data";
import { BilingualText } from "./bilingual-text";

type NavItem = {
  href: string;
  label: BilingualValue;
};

type SiteHeaderNavProps = {
  items: NavItem[];
};

export function SiteHeaderNav({ items }: SiteHeaderNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="site-mobile-nav"
        onClick={() => setOpen((value) => !value)}
        className="relative z-[60] inline-flex min-h-10 cursor-pointer select-none items-center rounded-full border border-[var(--line)]/70 px-3 text-[var(--muted)] transition-colors hover:border-[var(--line-strong)]/42 hover:text-[var(--ink)] lg:hidden"
      >
        <span className="text-[0.72rem] tracking-[0.08em]">{open ? "关闭" : "导航"}</span>
      </button>

      <nav
        aria-label="主导航"
        className="hidden min-w-0 flex-shrink-0 items-center justify-end gap-3 overflow-x-auto pl-2 text-sm text-[var(--muted)] lg:flex lg:gap-[0.78rem] lg:pl-3 xl:gap-[1.04rem] xl:pl-5 2xl:gap-[1.26rem]"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="min-w-fit cursor-pointer select-none whitespace-nowrap py-1 transition-colors duration-300 hover:text-[var(--ink)]"
          >
            <BilingualText
              as="span"
              text={item.label}
              mode="inline"
              className="text-[0.76rem] xl:text-[0.83rem] 2xl:text-[0.88rem]"
              zhClassName="text-[0.76rem] font-[430] xl:text-[0.83rem] 2xl:text-[0.88rem]"
              enClassName="text-[0.47rem] uppercase tracking-[0.11em] text-[var(--accent)]/90 xl:text-[0.51rem] xl:tracking-[0.12em] 2xl:text-[0.55rem] 2xl:tracking-[0.125em]"
            />
          </Link>
        ))}
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 bg-[rgba(23,21,18,0.16)] lg:hidden" onClick={() => setOpen(false)}>
          <div
            id="site-mobile-nav"
            className="absolute inset-x-0 top-0 border-b border-[var(--line)] bg-[var(--surface)] px-5 pb-5 pt-20 shadow-[0_20px_48px_rgba(17,14,12,0.08)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-1.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="cursor-pointer select-none border-b border-[var(--line)]/45 py-3 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                >
                  <BilingualText
                    as="span"
                    text={item.label}
                    mode="inline"
                    className="text-[0.94rem]"
                    zhClassName="text-[0.94rem]"
                    enClassName="text-[0.44rem] uppercase tracking-[0.14em] text-[var(--accent)]/62"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
