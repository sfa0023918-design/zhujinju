import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { editableSections, loadSiteContent } from "@/lib/site-data";

export default async function AdminDashboardPage() {
  const content = await loadSiteContent();

  const overview = [
    { label: "藏品", value: content.artworks.length },
    { label: "展览", value: content.exhibitions.length },
    { label: "文章", value: content.articles.length },
    { label: "收藏方向", value: content.collectingDirections.length },
  ];

  return (
    <AdminShell>
      <div className="space-y-10">
      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-[0.74rem] tracking-[0.2em] text-[var(--accent)]">内容总览</p>
        <h1 className="font-serif text-[2.2rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[3.8rem]">
          内容后台
        </h1>
        <p className="max-w-3xl text-sm leading-8 text-[var(--muted)]">
          这里管理的是网站正式内容。你可以直接通过表单修改文字、添加条目、上传图片；保存后会更新仓库内容，并触发 Vercel 自动重新部署。
        </p>
      </div>

      <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
        {overview.map((item) => (
          <div key={item.label} className="bg-[var(--surface)] p-6">
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">{item.label}</p>
            <p className="mt-4 font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--ink)]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {editableSections.map((section) => (
          <Link
            key={section.key}
            href={`/admin/content/${section.key}`}
            className="border border-[var(--line)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--line-strong)]"
          >
            <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">{section.title.zh}</p>
            <p className="mt-3 font-serif text-[1.7rem] leading-tight tracking-[-0.03em] text-[var(--ink)]">
              {section.title.en}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{section.description.zh}</p>
          </Link>
        ))}
      </div>
      </div>
    </AdminShell>
  );
}
