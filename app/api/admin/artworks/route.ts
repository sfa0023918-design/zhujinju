import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { createArtworkDraft } from "@/lib/site-data";

export async function POST() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  try {
    const result = await createArtworkDraft(session.email);

    return NextResponse.json({
      artwork: result.artwork,
      artworks: result.artworks,
      message: "新藏品草稿已创建。现在可以直接上传图片并继续填写文字。",
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
