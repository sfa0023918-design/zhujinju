import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { ContentValidationError, editableSections, getEditableSectionValue, saveSiteSection } from "@/lib/site-data";

type SectionRouteProps = {
  params: Promise<{
    section: string;
  }>;
};

export async function PATCH(request: Request, { params }: SectionRouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  const { section } = await params;
  const sectionMeta = editableSections.find((item) => item.key === section);

  if (!sectionMeta) {
    return NextResponse.json({ error: "未知的内容分区。" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      value?: unknown;
    };

    if (typeof body.value === "undefined") {
      return NextResponse.json({ error: "缺少要保存的内容。" }, { status: 400 });
    }

    const nextContent = await saveSiteSection(sectionMeta.key, body.value as never, session.email);

    return NextResponse.json({
      section: sectionMeta.key,
      value: getEditableSectionValue(nextContent, sectionMeta.key),
      message: "内容已保存。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "保存失败。",
      },
      { status: error instanceof ContentValidationError ? 400 : 500 },
    );
  }
}
