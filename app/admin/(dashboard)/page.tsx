import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { editableSections, getPublicArticles, getPublicArtworks, getPublicExhibitions, readSiteContentFresh } from "@/lib/site-data";

export default async function AdminDashboardPage() {
  const content = await readSiteContentFresh();
  const publishedArtworks = getPublicArtworks(content).length;
  const publishedExhibitions = getPublicExhibitions(content).length;
  const publishedArticles = getPublicArticles(content).length;

  const overview = [
    { label: "藏品", value: `${publishedArtworks} / ${content.artworks.length}` },
    { label: "展览", value: `${publishedExhibitions} / ${content.exhibitions.length}` },
    { label: "文章", value: `${publishedArticles} / ${content.articles.length}` },
    { label: "收藏方向", value: content.collectingDirections.length },
  ];

  const pageWorkflow = [
    {
      step: "第 1 步",
      title: "首页与页脚",
      description: "先改首页固定文案、页脚简介、联系表单提示。这些最容易看到，也最不容易漏。",
      href: "/admin/content/pageCopy#page-home",
    },
    {
      step: "第 2 步",
      title: "藏品详情页与图片上传",
      description: "上传每件藏品的主图和细节图，再依次填写标题、年代、地区、材质、来源、出版和展览。",
      href: "/admin/content/artworks",
    },
    {
      step: "第 3 步",
      title: "藏品列表页",
      description: "修改筛选栏、列表页顶部说明，以及藏品详情页的固定栏目标题。",
      href: "/admin/content/pageCopy#page-collection",
    },
    {
      step: "第 4 步",
      title: "展览页",
      description: "先上传封面，再填时间、地点、策展前言、重点作品与图录信息。",
      href: "/admin/content/exhibitions",
    },
    {
      step: "第 5 步",
      title: "文章页",
      description: "先上传封面，再写标题、作者、摘要、正文和关键词。",
      href: "/admin/content/articles",
    },
    {
      step: "第 6 步",
      title: "关于页与联系页",
      description: "最后调整品牌介绍、联系说明、回复时间、合作说明和预约方式。",
      href: "/admin/content/pageCopy#page-about",
    },
  ];
  const supportSections = editableSections.filter((section) =>
    ["brandIntro", "collectingDirections", "operationalFacts", "siteConfig"].includes(section.key),
  );

  return (
    <AdminShell>
      <div className="space-y-10">
      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-[0.74rem] tracking-[0.2em] text-[var(--accent)]">内容总览</p>
        <h1 className="font-serif text-[2.2rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[3.8rem]">
          内容后台
        </h1>
        <p className="max-w-3xl text-sm leading-8 text-[var(--muted)]">
          这里管理的是网站正式内容。整个后台已经按前台网页的阅读顺序整理过。你只需要从“第 1 步”开始往下改，不需要理解代码，也不需要先理解网站结构。
        </p>
      </div>

      <div className="grid gap-4 border border-[var(--line)] bg-[var(--surface)] p-6 md:grid-cols-3">
        <div>
          <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">怎么使用</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">按下面的步骤卡片，从上到下依次修改。每张卡片都对应前台真实页面。</p>
        </div>
        <div>
          <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">图片怎么改</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">凡是带图片的页面，都把上传入口放在该页面编辑区的最前面，先传图，再填文字。</p>
        </div>
        <div>
          <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">保存方式</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">上传图片后系统会自动保存当前分区；修改文字后再点一次保存即可，网站会自动更新。</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pageWorkflow.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--line-strong)]"
          >
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">{item.step}</p>
            <p className="mt-3 text-[1.05rem] text-[var(--ink)]">{item.title}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
        {overview.map((item) => (
          <div key={item.label} className="bg-[var(--surface)] p-6">
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">{item.label}</p>
            <p className="mt-4 font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--ink)]">
              {item.value}
            </p>
            {typeof item.value === "string" && item.value.includes("/") ? (
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">已发布 / 全部</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {supportSections.map((section) => (
          <Link
            key={section.key}
            href={`/admin/content/${section.key}`}
            className="border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--line-strong)]"
          >
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">补充设置</p>
            <p className="mt-3 font-serif text-[1.7rem] leading-tight tracking-[-0.03em] text-[var(--ink)]">
              {section.title.zh}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{section.description.zh}</p>
          </Link>
        ))}
      </div>
      </div>
    </AdminShell>
  );
}
