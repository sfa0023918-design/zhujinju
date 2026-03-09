import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { createArtworkDraft, duplicateArtworkRecord } from "@/lib/site-data";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  try {
    const body = await request
      .json()
      .catch(() => ({})) as { sourceId?: string };
    if ("sourceId" in body && typeof body.sourceId === "string" && !body.sourceId.trim()) {
      return NextResponse.json({ error: "缺少要复制的当前藏品。" }, { status: 400 });
    }
    const result = body.sourceId?.trim()
      ? await duplicateArtworkRecord(body.sourceId.trim(), session.email)
      : await createArtworkDraft(session.email);

    return NextResponse.json({
      artwork: result.artwork,
      artworks: result.artworks,
      message: body.sourceId?.trim()
        ? "已复制当前藏品，并创建为新的草稿。"
        : "新藏品草稿已创建。现在可以直接上传图片并继续填写文字。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "新建藏品失败。",
      },
      { status: 500 },
    );
  }
}
