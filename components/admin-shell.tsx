import Link from "next/link";

import type { ReactNode } from "react";

import { logoutAdmin } from "@/app/admin/actions";
import { editableSections } from "@/lib/site-data";

type AdminShellProps = {
  activeSection?: string;
  children: ReactNode;
};

export function AdminShell({ activeSection, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto grid w-full max-w-[1640px] gap-10 px-5 py-8 md:grid-cols-[280px_minmax(0,1fr)] md:px-10 md:py-10">
        <aside className="space-y-6 border-b border-[var(--line)] pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-8">
          <div className="space-y-2">
            <p className="text-[0.72rem] tracking-[0.22em] text-[var(--accent)]">竹瑾居内容后台</p>
            <h2 className="font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--ink)]">
              Admin
            </h2>
          </div>
          <nav className="grid gap-2">
            <Link
              href="/admin"
              className={`border px-4 py-3 text-sm transition-colors ${
                !activeSection
                  ? "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)]"
                  : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              }`}
            >
              后台首页
            </Link>
            {editableSections.map((section) => (
              <Link
                key={section.key}
                href={`/admin/content/${section.key}`}
                className={`border px-4 py-3 text-sm transition-colors ${
                  activeSection === section.key
                    ? "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                }`}
              >
                <p>{section.title.zh}</p>
                <p className="mt-1 text-[0.72rem] leading-6 text-[var(--accent)]/78">
                  {section.description.zh}
                </p>
              </Link>
            ))}
          </nav>
          <form action={logoutAdmin} className="pt-4">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-5 text-sm text-[var(--muted)] transition-colors duration-300 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
            >
              退出后台
            </button>
          </form>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
