import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { revalidatePublicSite } from "@/lib/public-site-revalidate";
import {
  ContentValidationError,
  createArticleDraft,
  createExhibitionDraft,
  deleteArticleRecord,
  deleteExhibitionRecord,
  duplicateArticleRecord,
  duplicateExhibitionRecord,
  editableSections,
  getEditableSectionValue,
  saveSiteSection,
} from "@/lib/site-data";

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
      baseValue?: unknown;
    };

    if (typeof body.value === "undefined") {
      return NextResponse.json({ error: "缺少要保存的内容。" }, { status: 400 });
    }

    const nextContent = await saveSiteSection(sectionMeta.key, body.value as never, session.email, {
      baseValue: body.baseValue as never,
    });
    revalidatePublicSite();

    return NextResponse.json({
      section: sectionMeta.key,
      value: getEditableSectionValue(nextContent, sectionMeta.key),
      message: "内容已保存。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "保存失败。",
        issues: error instanceof ContentValidationError ? error.issues : undefined,
      },
      { status: error instanceof ContentValidationError ? 400 : 500 },
    );
  }
}

export async function POST(request: Request, { params }: SectionRouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  const { section } = await params;

  if (section !== "exhibitions" && section !== "articles") {
    return NextResponse.json({ error: "当前分区不支持这个操作。" }, { status: 400 });
  }

  try {
    const body = await request
      .json()
      .catch(() => ({})) as { action?: "create" | "duplicate"; slug?: string };
    const action = body.action === "duplicate" ? "duplicate" : "create";

    if (action === "duplicate" && !body.slug?.trim()) {
      return NextResponse.json({ error: "缺少要复制的当前记录。" }, { status: 400 });
    }

    if (section === "exhibitions") {
      const result =
        action === "duplicate" && body.slug?.trim()
          ? await duplicateExhibitionRecord(body.slug.trim(), session.email)
          : await createExhibitionDraft(session.email);
      revalidatePublicSite();

      return NextResponse.json({
        section,
        item: result.exhibition,
        value: result.exhibitions,
        message:
          action === "duplicate" && body.slug?.trim()
            ? "已复制当前展览，并创建为新的草稿。"
            : "新展览草稿已创建。",
      });
    }

    const result =
      action === "duplicate" && body.slug?.trim()
        ? await duplicateArticleRecord(body.slug.trim(), session.email)
        : await createArticleDraft(session.email);
    revalidatePublicSite();

    return NextResponse.json({
      section,
      item: result.article,
      value: result.articles,
      message:
        action === "duplicate" && body.slug?.trim()
          ? "已复制当前文章，并创建为新的草稿。"
          : "新文章草稿已创建。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "操作失败。",
        issues: error instanceof ContentValidationError ? error.issues : undefined,
      },
      { status: error instanceof ContentValidationError ? 400 : 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: SectionRouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  const { section } = await params;

  if (section !== "exhibitions" && section !== "articles") {
    return NextResponse.json({ error: "当前分区不支持删除操作。" }, { status: 400 });
  }

  try {
    const body = await request
      .json()
      .catch(() => ({})) as { slug?: string };

    if (!body.slug?.trim()) {
      return NextResponse.json({ error: "缺少要删除的记录。" }, { status: 400 });
    }

    if (section === "exhibitions") {
      const result = await deleteExhibitionRecord(body.slug.trim(), session.email);
      revalidatePublicSite();

      return NextResponse.json({
        section,
        value: result.exhibitions,
        message: "展览已删除。",
      });
    }

    const result = await deleteArticleRecord(body.slug.trim(), session.email);
    revalidatePublicSite();

    return NextResponse.json({
      section,
      value: result.articles,
      message: "文章已删除。",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "删除失败。",
      },
      { status: 500 },
    );
  }
}
