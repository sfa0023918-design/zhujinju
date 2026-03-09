import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { editableSections, getPublicArticles, getPublicArtworks, getPublicExhibitions, readSiteContentFresh } from "@/lib/site-data";

const UNTITLED_ARTWORK_TITLES = new Set(["", "未命名藏品", "Untitled Artwork"]);

function parseExhibitionEndDate(period: string) {
  const matches = Array.from(period.matchAll(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/g));
  const lastMatch = matches[matches.length - 1];

  if (!lastMatch) {
    return null;
  }

  const [, year, month, day] = lastMatch;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default async function AdminDashboardPage() {
  const content = await readSiteContentFresh();
  const publishedArtworks = getPublicArtworks(content).length;
  const publishedExhibitions = getPublicExhibitions(content).length;
  const publishedArticles = getPublicArticles(content).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const missingArtworkImageCount = content.artworks.filter((artwork) => !artwork.image.trim()).length;
  const untitledDraftArtworkCount = content.artworks.filter((artwork) => {
    const title = artwork.title.zh.trim() || artwork.title.en.trim();
    return (artwork.publicationStatus ?? "draft") === "draft" && UNTITLED_ARTWORK_TITLES.has(title);
  }).length;
  const expiredCurrentExhibitionCount = content.exhibitions.filter((exhibition) => {
    if (!exhibition.current) {
      return false;
    }

    const endDate = parseExhibitionEndDate(exhibition.period.zh || exhibition.period.en);
    return Boolean(endDate && endDate < today);
  }).length;
  const missingContactItems = [
    !content.siteConfig.contact.email.trim() ? "邮箱" : null,
    !content.siteConfig.contact.phone.trim() ? "电话" : null,
    !content.siteConfig.contact.wechat.trim() ? "微信" : null,
    !content.siteConfig.contact.instagram.trim() ? "Instagram" : null,
  ].filter((item): item is string => Boolean(item));

  const overview = [
    { label: "藏品", value: `${publishedArtworks} / ${content.artworks.length}` },
    { label: "展览", value: `${publishedExhibitions} / ${content.exhibitions.length}` },
    { label: "文章", value: `${publishedArticles} / ${content.articles.length}` },
    { label: "首页模块", value: 4 },
  ];
  const healthChecks = [
    {
      label: "缺主图藏品",
      value: String(missingArtworkImageCount),
      note: "含草稿与已发布藏品",
    },
    {
      label: "空标题草稿",
      value: String(untitledDraftArtworkCount),
      note: "包含“未命名藏品”占位标题",
    },
    {
      label: "已过期专题",
      value: String(expiredCurrentExhibitionCount),
      note: "当前专题已过结束日期",
    },
    {
      label: "联系方式缺项",
      value: String(missingContactItems.length),
      note: missingContactItems.length ? missingContactItems.join("、") : "当前完整",
    },
  ];

  const shortcuts = editableSections.map((section) => ({
    title: section.title.zh,
    description: section.description.zh,
    href: `/admin/content/${section.key}`,
  }));

  return (
    <AdminShell>
      <div className="space-y-10">
        <div className="space-y-3 border-b border-[var(--line)] pb-6">
          <p className="text-[0.74rem] tracking-[0.2em] text-[var(--accent)]">内容总览</p>
          <h1 className="font-serif text-[2.2rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[3.8rem]">
            轻量 CMS
          </h1>
          <p className="max-w-3xl text-sm leading-8 text-[var(--muted)]">
            这里保留六个最常用的后台入口。品牌、关于、联系、页脚与 SEO 集中放在站点设置；首页内容单独维护；藏品、展览与文章各自独立管理。
          </p>
        </div>

        <div className="grid gap-4 border border-[var(--line)] bg-[var(--surface)] p-6 md:grid-cols-3">
          <div>
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">怎么使用</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">左侧直接进入要修改的页面。文字会自动保存，发布与取消发布是明确按钮。</p>
          </div>
          <div>
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">图片怎么改</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">主图和细节图都直接绑定真实藏品记录，上传后即时写入，不再需要先理解分区保存。</p>
          </div>
          <div>
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">内容结构</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">首页、关于、联系、页脚的重复字段已经收口，减少多处维护带来的错漏。</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--line-strong)]"
            >
              <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">后台入口</p>
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

        <div className="space-y-4">
          <div className="space-y-2 border-b border-[var(--line)] pb-4">
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">健康检查</p>
            <p className="text-sm leading-7 text-[var(--muted)]">用来快速发现发布前最容易遗漏的内容问题。</p>
          </div>
          <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 xl:grid-cols-4">
            {healthChecks.map((item) => (
              <div key={item.label} className="bg-[var(--surface)] p-6">
                <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">{item.label}</p>
                <p className="mt-4 font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--ink)]">
                  {item.value}
                </p>
                <p className="mt-3 text-xs leading-6 text-[var(--muted)]">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
