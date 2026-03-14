import { redirect } from "next/navigation";

import { getAdminSession, isAdminConfigured } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = buildMetadata({
  title: "内容后台登录",
  description: "竹瑾居内容后台登录页面。",
  path: "/admin/login",
});

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolvedSearchParams.error;

  if (session) {
    redirect("/admin");
  }

  return (
    <section className="mx-auto grid min-h-screen w-full max-w-[1080px] gap-10 px-5 py-12 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-20">
      <div className="space-y-5">
        <p className="text-[0.74rem] tracking-[0.2em] text-[var(--accent)]">竹瑾居内容后台</p>
        <h1 className="max-w-[8ch] font-serif text-[2.6rem] leading-[0.94] tracking-[-0.05em] text-[var(--ink)] md:text-[4.6rem]">
          网站内容管理
        </h1>
          <p className="max-w-xl text-sm leading-8 text-[var(--muted)]">
            后台用于维护竹瑾居网站的品牌信息、首页内容、藏品、展览与文章，并支持上传本地图片。
          </p>
        {!isAdminConfigured() ? (
          <div className="border border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-7 text-[#8e4e3b]">
            生产环境尚未配置 `ADMIN_EMAIL`、`ADMIN_PASSWORD` 与 `ADMIN_SESSION_SECRET`。请先配置环境变量后再使用后台。
          </div>
        ) : null}
      </div>
      <form
        action="/admin/auth/login"
        method="post"
        className="space-y-5 border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8"
      >
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <span className="text-[0.76rem] tracking-[0.18em] text-[var(--accent)]">管理员邮箱</span>
          <input
            required
            name="email"
            type="email"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <span className="text-[0.76rem] tracking-[0.18em] text-[var(--accent)]">管理员密码</span>
          <input
            required
            name="password"
            type="password"
            className="h-11 border border-[var(--line)] bg-[var(--bg)] px-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-6 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)]"
        >
          进入内容后台
        </button>
        {error ? <p className="text-sm leading-7 text-[#8e4e3b]">{decodeURIComponent(error)}</p> : null}
      </form>
    </section>
  );
}
