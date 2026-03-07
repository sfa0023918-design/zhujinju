import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "未检测到上传文件。" }, { status: 400 });
    }

    const result = await uploadAdminImage(file, folder, session.email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "图片上传失败。",
      },
      { status: 500 },
    );
  }
}
