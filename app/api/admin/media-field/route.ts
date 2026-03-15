import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { saveArtworkMediaField, saveRecordMediaField } from "@/lib/content-store";
import { revalidatePublicSite } from "@/lib/public-site-revalidate";
import { appendDeployStatusMessage, triggerVercelDeploy } from "@/lib/vercel-deploy";

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

    if (!body.targetId) {
      return NextResponse.json({ error: "无效的图片字段请求。" }, { status: 400 });
    }

    if (body.targetSection === "artworks" && (body.targetField === "image" || body.targetField === "gallery")) {
      await saveArtworkMediaField(
        body.targetId,
        body.targetField,
        String(body.value ?? ""),
        session.email,
        {
          galleryIndex: body.targetField === "gallery" && typeof body.targetIndex === "number" ? body.targetIndex : undefined,
        },
      );
      revalidatePublicSite();
      const deploy = await triggerVercelDeploy(`Admin updated artwork media field for ${body.targetId}`);

      return NextResponse.json({
        saved: true,
        message:
          appendDeployStatusMessage(
            body.value && String(body.value).trim() ? "图片路径已写入当前藏品。" : "图片已从当前藏品中移除。",
            deploy,
          ),
      });
    }

    if ((body.targetSection === "exhibitions" || body.targetSection === "articles") && body.targetField === "cover") {
      await saveRecordMediaField(
        body.targetSection,
        body.targetId,
        "cover",
        String(body.value ?? ""),
        session.email,
      );
      revalidatePublicSite();
      const deploy = await triggerVercelDeploy(`Admin updated ${body.targetSection} cover media for ${body.targetId}`);

      return NextResponse.json({
        saved: true,
        message:
          appendDeployStatusMessage(
            body.value && String(body.value).trim() ? "封面图已写入当前内容。" : "封面图已从当前内容中移除。",
            deploy,
          ),
      });
    }

    return NextResponse.json({ error: "无效的图片字段请求。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "图片字段保存失败。",
      },
      { status: 500 },
    );
  }
}
