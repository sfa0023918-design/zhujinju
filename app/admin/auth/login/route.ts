import { redirect } from "next/navigation";

import { createAdminSession, verifyAdminLogin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=%E8%AF%B7%E8%BE%93%E5%85%A5%E7%AE%A1%E7%90%86%E5%91%98%E9%82%AE%E7%AE%B1%E5%92%8C%E5%AF%86%E7%A0%81%E3%80%82");
  }

  const valid = await verifyAdminLogin(email, password);

  if (!valid) {
    redirect("/admin/login?error=%E8%B4%A6%E5%8F%B7%E6%88%96%E5%AF%86%E7%A0%81%E4%B8%8D%E6%AD%A3%E7%A1%AE%E3%80%82");
  }

  await createAdminSession(email);
  redirect("/admin");
}
