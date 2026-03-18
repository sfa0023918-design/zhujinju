"use server";

import { redirect } from "next/navigation";

import { clearAdminSession, createAdminSession, verifyAdminLogin } from "@/lib/admin-auth";

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
