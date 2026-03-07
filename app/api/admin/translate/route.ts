import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";

const OPENAI_TRANSLATION_MODEL = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-5-mini";

function extractOutputText(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "output_text" in payload &&
    typeof (payload as { output_text?: unknown }).output_text === "string"
  ) {
    return (payload as { output_text: string }).output_text.trim();
  }

  if (
    payload &&
    typeof payload === "object" &&
    "output" in payload &&
    Array.isArray((payload as { output?: unknown[] }).output)
  ) {
    for (const item of (payload as { output: Array<{ content?: Array<{ text?: string }> }> }).output) {
      for (const content of item.content ?? []) {
        if (typeof content.text === "string" && content.text.trim()) {
          return content.text.trim();
        }
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "后台尚未配置 OPENAI_API_KEY，暂时无法自动生成英文。" },
      { status: 503 },
    );
  }

  try {
    const { text, label } = (await request.json()) as {
      text?: string;
      label?: string;
    };

    const sourceText = text?.trim();

    if (!sourceText) {
      return NextResponse.json({ error: "未检测到需要翻译的中文内容。" }, { status: 400 });
    }

    const prompt = [
      "你是国际古董艺廊的网站编辑。",
      "请把下面的中文内容翻译成自然、克制、专业的英文，用于高端喜马拉雅艺术与亚洲古代艺术网站。",
      "要求：",
      "1. 只输出英文翻译本身，不要解释。",
      "2. 保持简洁，不要营销化。",
      "3. 保留专有名词、年代、地名、材料名的专业表达。",
      "4. 如果字段是标题，就翻成适合网页标题的简洁英文。",
      `字段名称：${label?.trim() || "未提供"}`,
      `中文内容：${sourceText}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_TRANSLATION_MODEL,
        input: prompt,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? (payload as { error?: { message?: string } }).error?.message
          : "自动翻译失败。";

      return NextResponse.json({ error: message ?? "自动翻译失败。" }, { status: response.status });
    }

    const translation = extractOutputText(payload);

    if (!translation) {
      return NextResponse.json({ error: "未生成可用英文内容，请重试一次。" }, { status: 502 });
    }

    return NextResponse.json({ translation });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "自动翻译失败。",
      },
      { status: 500 },
    );
  }
}
