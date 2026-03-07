import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { saveArtworkMediaField } from "@/lib/content-store";
import { uploadAdminImage } from "@/lib/admin-media";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") ?? "misc");
    const targetSection = String(formData.get("targetSection") ?? "");
    const targetSlug = String(formData.get("targetSlug") ?? "");
    const targetField = String(formData.get("targetField") ?? "");
    const targetIndexRaw = String(formData.get("targetIndex") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "未检测到上传文件。" }, { status: 400 });
    }

    const result = await uploadAdminImage(file, folder, session.email);

    if (targetSection === "artworks" && targetSlug && (targetField === "image" || targetField === "gallery")) {
      await saveArtworkMediaField(targetSlug, targetField, result.url, session.email, {
        galleryIndex: targetField === "gallery" && targetIndexRaw ? Number(targetIndexRaw) : undefined,
      });

      return NextResponse.json({
        ...result,
        saved: true,
        message: "图片已上传并写入当前藏品。部署完成后，前台会按你的细节图顺序显示。",
      });
    }

    return NextResponse.json({
      ...result,
      saved: false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "图片上传失败。",
      },
      { status: 500 },
    );
  }
}
