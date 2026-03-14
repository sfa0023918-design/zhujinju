import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { assertMediaTargetExists, saveArtworkMediaField, saveRecordMediaField } from "@/lib/content-store";
import { uploadAdminImage } from "@/lib/admin-media";
import { revalidatePublicSite } from "@/lib/public-site-revalidate";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const variantCard = formData.get("variantCard");
    const folder = String(formData.get("folder") ?? "misc");
    const targetSection = String(formData.get("targetSection") ?? "");
    const targetId = String(formData.get("targetId") ?? "");
    const targetField = String(formData.get("targetField") ?? "");
    const targetIndexRaw = String(formData.get("targetIndex") ?? "");
    const assetWidth = Number(formData.get("assetWidth") ?? 0);
    const assetHeight = Number(formData.get("assetHeight") ?? 0);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "未检测到上传文件。" }, { status: 400 });
    }

    if ((targetSection === "artworks" || targetSection === "exhibitions" || targetSection === "articles") && !targetId) {
      return NextResponse.json({ error: "当前内容还没有真实记录，不能上传图片。" }, { status: 400 });
    }

    if (targetSection === "artworks" || targetSection === "exhibitions" || targetSection === "articles") {
      await assertMediaTargetExists(targetSection, targetId);
    }

    const result = await uploadAdminImage(
      file,
      folder,
      session.email,
      {
        card: variantCard instanceof File ? variantCard : null,
      },
      {
        width: assetWidth > 0 ? assetWidth : undefined,
        height: assetHeight > 0 ? assetHeight : undefined,
      },
    );

    if (targetSection === "artworks" && targetId && (targetField === "image" || targetField === "gallery")) {
      await saveArtworkMediaField(targetId, targetField, result.url, session.email, {
        galleryIndex: targetField === "gallery" && targetIndexRaw ? Number(targetIndexRaw) : undefined,
        asset: result.asset,
      });
      revalidatePublicSite();

      return NextResponse.json({
        ...result,
        saved: true,
        message: "图片已上传并写入当前藏品。",
      });
    }

    if ((targetSection === "exhibitions" || targetSection === "articles") && targetId && targetField === "cover") {
      await saveRecordMediaField(targetSection, targetId, "cover", result.url, session.email, {
        asset: result.asset,
      });
      revalidatePublicSite();

      return NextResponse.json({
        ...result,
        saved: true,
        message: "图片已上传并写入当前内容。",
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
