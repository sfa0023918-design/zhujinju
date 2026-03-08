import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { saveArtworkMediaField } from "@/lib/content-store";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      targetSection?: string;
      targetId?: string;
      targetField?: string;
      targetIndex?: number;
      value?: string;
    };

    if (body.targetSection !== "artworks" || !body.targetId || (body.targetField !== "image" && body.targetField !== "gallery")) {
      return NextResponse.json({ error: "无效的图片字段请求。" }, { status: 400 });
    }

    await saveArtworkMediaField(
      body.targetId,
      body.targetField,
      String(body.value ?? ""),
      session.email,
      {
        galleryIndex: body.targetField === "gallery" && typeof body.targetIndex === "number" ? body.targetIndex : undefined,
      },
    );

    return NextResponse.json({
      saved: true,
      message:
        body.value && String(body.value).trim()
          ? "图片路径已写入当前藏品。部署完成后，前台会显示最新图片。"
          : "图片已从当前藏品中移除。部署完成后，前台会同步更新。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "图片字段保存失败。",
      },
      { status: 500 },
    );
  }
}
