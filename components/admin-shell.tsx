import Link from "next/link";

import type { ReactNode } from "react";

import { logoutAdmin } from "@/app/admin/actions";
import { editableSections } from "@/lib/site-data";

type AdminShellProps = {
  activeSection?: string;
  children: ReactNode;
};

export function AdminShell({ activeSection, children }: AdminShellProps) {
  const pageWorkflowLinks = [
    {
      href: "/admin/content/pageCopy#page-home",
      key: "pageCopy",
      title: "1. 首页与页脚",
      description: "先改首页、页脚、联系表单这些最常用内容。",
    },
    {
      href: "/admin/content/artworks",
      key: "artworks",
      title: "2. 藏品详情页",
      description: "上传主图、修改作品信息、来源、展览与出版。",
    },
    {
      href: "/admin/content/pageCopy#page-collection",
      key: "pageCopy",
      title: "3. 藏品列表页",
      description: "改筛选栏、列表页说明、详情页固定标题。",
    },
    {
      href: "/admin/content/exhibitions",
      key: "exhibitions",
      title: "4. 展览页",
      description: "上传封面、修改展览列表与详情内容。",
    },
    {
      href: "/admin/content/articles",
      key: "articles",
      title: "5. 文章页",
      description: "上传封面、修改文章列表与正文。",
    },
    {
      href: "/admin/content/pageCopy#page-about",
      key: "pageCopy",
      title: "6. 关于与联系页",
      description: "最后修改关于页、联系页、表单提示文字。",
    },
  ];

  const supportLinks = editableSections.filter((section) =>
    ["brandIntro", "collectingDirections", "operationalFacts", "siteConfig"].includes(section.key),
  );

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
          </nav>

          <div className="space-y-3">
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">按网页顺序修改</p>
            <nav className="grid gap-2">
              {pageWorkflowLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`border px-4 py-3 text-sm transition-colors ${
                    activeSection === link.key
                      ? "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)]"
                      : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                  }`}
                >
                  <p>{link.title}</p>
                  <p className="mt-1 text-[0.72rem] leading-6 text-[var(--accent)]/78">{link.description}</p>
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">网站基础信息</p>
            <nav className="grid gap-2">
              {supportLinks.map((section) => (
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
          </div>
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
