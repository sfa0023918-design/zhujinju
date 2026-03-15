"use server";

import { redirect } from "next/navigation";

import { clearAdminSession, createAdminSession, requireAdminSession, verifyAdminLogin } from "@/lib/admin-auth";
import { revalidatePublicSite } from "@/lib/public-site-revalidate";
import { editableSections, saveSiteSection } from "@/lib/site-data";

export type AdminActionState = {
  error?: string;
  success?: string;
};

export async function loginAdmin(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "请输入管理员邮箱和密码。" };
  }

  const valid = await verifyAdminLogin(email, password);

  if (!valid) {
    return { error: "账号或密码不正确。" };
  }

  await createAdminSession(email);
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function saveAdminSection(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const section = String(formData.get("section") ?? "");
  const raw = String(formData.get("content") ?? "");

  if (!editableSections.some((item) => item.key === section)) {
    return { error: "未知的内容分区。" };
  }

  try {
    const parsed = JSON.parse(raw);
    await saveSiteSection(section as (typeof editableSections)[number]["key"], parsed, session.email);

    revalidatePublicSite();

    return { success: "内容已保存。正式站内容会自动刷新；若本次包含新上传图片，请等待图片同步完成。" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "保存失败，请检查 JSON 格式。",
    };
  }
}
