import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { fallbackTranslateChineseToEnglish } from "@/lib/admin-translation-fallback";

const OPENAI_TRANSLATION_MODEL = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-5-mini";
const OPENAI_TRANSLATION_BASE_URL = (process.env.OPENAI_TRANSLATION_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_TRANSLATION_API_STYLE =
  process.env.OPENAI_TRANSLATION_API_STYLE ??
  (OPENAI_TRANSLATION_BASE_URL.includes("api.openai.com") ? "responses" : "chat");
const OPENAI_TRANSLATION_API_KEY = process.env.OPENAI_API_KEY?.trim();
const USE_THIRD_PARTY_TRANSLATION = !OPENAI_TRANSLATION_BASE_URL.includes("api.openai.com");

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

function extractChatCompletionText(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "choices" in payload &&
    Array.isArray((payload as { choices?: unknown[] }).choices)
  ) {
    const choices = (payload as { choices: Array<{ message?: { content?: unknown } }> }).choices;

    for (const choice of choices) {
      const content = choice.message?.content;

      if (typeof content === "string" && content.trim()) {
        return content.trim();
      }

      if (Array.isArray(content)) {
        for (const item of content) {
          if (
            item &&
            typeof item === "object" &&
            "text" in item &&
            typeof (item as { text?: unknown }).text === "string" &&
            (item as { text: string }).text.trim()
          ) {
            return (item as { text: string }).text.trim();
          }
        }
      }
    }
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeTranslation(raw: string) {
  const trimmed = raw.trim();

  if (!trimmed) {
    return "";
  }

  const paragraphs = trimmed
    .split(/\n\s*\n+/)
    .map((paragraph) =>
      paragraph
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) =>
          line.replace(
            /^(field name|字段名称|english translation|英文翻译|chinese content|中文内容|title|content)\s*[:：]\s*/i,
            "",
          ),
        )
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  const joined = paragraphs.join("\n\n").trim();
  return normalizeXizangTerminology(joined.replace(/^["“”']|["“”']$/g, "").trim());
}

function normalizeXizangTerminology(value: string) {
  return value
    .replace(/\bTibetan\b/g, "Xizang")
    .replace(/\btibetan\b/g, "xizang")
    .replace(/\bTibet\b/g, "Xizang")
    .replace(/\btibet\b/g, "xizang");
}

async function requestTranslation(endpoint: string, body: unknown) {
  const maxAttempts =
    OPENAI_TRANSLATION_API_STYLE === "chat" && USE_THIRD_PARTY_TRANSLATION ? 5 : OPENAI_TRANSLATION_API_STYLE === "chat" ? 3 : 2;
  let lastStatus = 502;
  let lastMessage = "自动翻译失败。";

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_TRANSLATION_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json();

    if (response.ok) {
      return { payload };
    }

    lastStatus = response.status;
    lastMessage =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as { error?: { message?: string } }).error?.message ?? "自动翻译失败。"
        : "自动翻译失败。";

    const retryable =
      response.status >= 500 ||
      response.status === 429 ||
      (response.status === 401 && /incorrect api key provided|unauthorized/i.test(lastMessage));

    if (!retryable || attempt === maxAttempts) {
      return { error: lastMessage, status: lastStatus };
    }

    const retryDelay =
      response.status === 401 && USE_THIRD_PARTY_TRANSLATION
        ? [900, 1600, 2600, 4200, 5200][attempt - 1] ?? 5200
        : response.status === 429
          ? [700, 1200, 2000, 3200, 4200][attempt - 1] ?? 4200
          : 220 * attempt;

    await sleep(retryDelay);
  }

  return { error: lastMessage, status: lastStatus };
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "登录状态已失效，请重新登录后台。" }, { status: 401 });
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

    if (!OPENAI_TRANSLATION_API_KEY) {
      const fallback = await fallbackTranslateChineseToEnglish(sourceText, label);

      if (fallback) {
        return NextResponse.json({ translation: normalizeXizangTerminology(fallback), fallback: true });
      }

      return NextResponse.json(
        { error: "后台尚未配置可用翻译服务，暂时无法自动生成英文。" },
        { status: 503 },
      );
    }

    const systemPrompt = [
      "你是国际古董艺廊的网站编辑。",
      "请把下面的中文内容翻译成自然、克制、专业的英文，用于高端喜马拉雅艺术与亚洲古代艺术网站。",
      "要求：",
      "1. 只输出英文翻译本身，不要解释。",
      "2. 保持简洁，不要营销化。",
      "3. 保留专有名词、年代、地名、材料名的专业表达。",
      "4. 如果字段是标题，就翻成适合网页标题的简洁英文。",
      "5. 不要复述字段名称，不要输出“英文翻译：”“字段名称：”之类前缀。",
    ].join("\n");
    const userPrompt = [
      `字段名称：${label?.trim() || "未提供"}`,
      "请直接翻译下面这段中文：",
      sourceText,
    ].join("\n");

    const endpoint =
      OPENAI_TRANSLATION_API_STYLE === "chat"
        ? `${OPENAI_TRANSLATION_BASE_URL}/chat/completions`
        : `${OPENAI_TRANSLATION_BASE_URL}/responses`;
    const body =
      OPENAI_TRANSLATION_API_STYLE === "chat"
        ? {
            model: OPENAI_TRANSLATION_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }
        : {
            model: OPENAI_TRANSLATION_MODEL,
            input: `${systemPrompt}\n${userPrompt}`,
          };

    const result = await requestTranslation(endpoint, body);

    if ("error" in result) {
      const fallback = await fallbackTranslateChineseToEnglish(sourceText, label);

      if (fallback) {
        return NextResponse.json({ translation: normalizeXizangTerminology(fallback), fallback: true });
      }

      const status = result.status ?? 502;
      const message =
        status === 401 || status === 429 || status >= 500
          ? "翻译服务当前较忙，请稍后再试一次。"
          : result.error ?? "自动翻译失败。";
      return NextResponse.json({ error: message }, { status });
    }

    const translation =
      OPENAI_TRANSLATION_API_STYLE === "chat"
        ? extractChatCompletionText(result.payload)
        : extractOutputText(result.payload);

    const normalizedTranslation = translation ? normalizeTranslation(translation) : "";

    if (!normalizedTranslation) {
      const fallback = await fallbackTranslateChineseToEnglish(sourceText, label);

      if (fallback) {
        return NextResponse.json({ translation: normalizeXizangTerminology(fallback), fallback: true });
      }

      return NextResponse.json({ error: "未生成可用英文内容，请重试一次。" }, { status: 502 });
    }

    return NextResponse.json({ translation: normalizeXizangTerminology(normalizedTranslation) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "自动翻译失败。",
      },
      { status: 500 },
    );
  }
}
