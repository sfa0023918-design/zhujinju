import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/admin-auth";
import { reorderArtworkRecords } from "@/lib/site-data";

function revalidateAdminArtworkViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/content/artworks");
  revalidatePath("/admin/content/homeContent");
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { artworkIds?: string[] };

    if (!Array.isArray(body.artworkIds) || body.artworkIds.length === 0) {
      return NextResponse.json({ error: "缺少排序后的藏品列表。" }, { status: 400 });
    }

    const result = await reorderArtworkRecords(body.artworkIds, session.email);
    revalidateAdminArtworkViews();

    return NextResponse.json({
      artworks: result.artworks,
      message: "藏品顺序已更新。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "更新藏品顺序失败。",
      },
      { status: 500 },
    );
  }
}
