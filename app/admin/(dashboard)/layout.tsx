import type { ReactNode } from "react";

import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSession();

  return children;
}
