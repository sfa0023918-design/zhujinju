import { redirect } from "next/navigation";

import { loginAdmin } from "@/app/admin/actions";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession, isAdminConfigured } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "内容后台登录",
  description: "竹瑾居内容后台登录页面。",
  path: "/admin/login",
});

export default async function AdminLoginPage() {
  const session = await getAdminSession();

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
            后台用于修改网站上的品牌信息、联系方式、藏品、展览与文章内容，并支持上传本地图片。保存后会写回 GitHub 仓库，并触发 Vercel 自动部署。
          </p>
        {!isAdminConfigured() ? (
          <div className="border border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-7 text-[#8e4e3b]">
            生产环境尚未配置 `ADMIN_EMAIL`、`ADMIN_PASSWORD` 与 `ADMIN_SESSION_SECRET`。请先配置环境变量后再使用后台。
          </div>
        ) : null}
      </div>
      <AdminLoginForm action={loginAdmin} />
    </section>
  );
}
