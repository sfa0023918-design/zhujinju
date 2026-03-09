import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { readSiteContentFresh } from "@/lib/site-data";
import { buildSiteSyncSnapshot, buildSyncTarget } from "@/lib/site-sync";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");
  const id = searchParams.get("id") ?? undefined;

  if (!section) {
    return NextResponse.json({ error: "缺少同步检查目标。" }, { status: 400 });
  }

  const target = buildSyncTarget(section as never, { id });

  if (!target) {
    return NextResponse.json({ error: "无效的同步检查目标。" }, { status: 400 });
  }

  try {
    const content = await readSiteContentFresh();
    const sync = await buildSiteSyncSnapshot(content, target);

    return NextResponse.json({ sync });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "网站同步状态读取失败。",
      },
      { status: 500 },
    );
  }
}
