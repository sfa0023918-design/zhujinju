import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import type { Artwork } from "@/lib/site-data";
import { ContentValidationError, deleteArtworkRecord, saveArtworkRecord } from "@/lib/site-data";

type ArtworkRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: ArtworkRouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as { artwork?: Artwork };

    if (!body.artwork) {
      return NextResponse.json({ error: "缺少藏品内容。" }, { status: 400 });
    }

    const result = await saveArtworkRecord(id, body.artwork, session.email);

    return NextResponse.json({
      artwork: result.artwork,
      artworks: result.artworks,
      message: "藏品内容已保存。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "藏品保存失败。",
        issues: error instanceof ContentValidationError ? error.issues : undefined,
      },
      { status: error instanceof ContentValidationError ? 400 : 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: ArtworkRouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await deleteArtworkRecord(id, session.email);

    return NextResponse.json({
      artworks: result.artworks,
      message: "藏品已删除。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "删除藏品失败。",
      },
      { status: 500 },
    );
  }
}
