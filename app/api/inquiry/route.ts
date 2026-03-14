import { NextResponse } from "next/server";

import { isInquiryConfigError, sendInquiryEmail } from "@/lib/inquiry-mail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_ORGANIZATION_LENGTH = 160;
const MAX_IDENTITY_LENGTH = 120;
const MAX_ARTWORK_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 6000;
const MIN_SUBMIT_INTERVAL_MS = 3000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const inquiryAttempts = new Map<string, number[]>();

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function getRequestOrigin(request: Request) {
  return request.headers.get("origin")?.trim() || request.headers.get("referer")?.trim() || "";
}

function isRateLimited(ip: string, now: number) {
  const attempts = inquiryAttempts.get(ip) ?? [];
  const activeAttempts = attempts.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (activeAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    inquiryAttempts.set(ip, activeAttempts);
    return true;
  }

  activeAttempts.push(now);
  inquiryAttempts.set(ip, activeAttempts);
  return false;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    message?: string;
    organization?: string;
    identity?: string;
    artwork?: string;
    website?: string;
    submittedAt?: string;
  };

  const ip = getClientIp(request);
  const now = Date.now();

  if (isRateLimited(ip, now)) {
    return NextResponse.json({ error: "提交过于频繁，请稍后再试。" }, { status: 429 });
  }

  const name = normalizeText(body.name);
  const email = normalizeText(body.email).toLowerCase();
  const message = normalizeText(body.message);
  const organization = normalizeText(body.organization);
  const identity = normalizeText(body.identity);
  const artwork = normalizeText(body.artwork);
  const website = normalizeText(body.website);
  const submittedAt = Number.parseInt(normalizeText(body.submittedAt), 10);

  if (website) {
    return NextResponse.json({ success: true, receivedAt: new Date(now).toISOString() });
  }

  if (!Number.isFinite(submittedAt) || now - submittedAt < MIN_SUBMIT_INTERVAL_MS) {
    return NextResponse.json({ error: "提交过快，请稍候再试。" }, { status: 400 });
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: "请填写姓名、邮箱和留言内容。" }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "请输入有效的邮箱地址。" }, { status: 400 });
  }

  if (
    name.length > MAX_NAME_LENGTH ||
    organization.length > MAX_ORGANIZATION_LENGTH ||
    identity.length > MAX_IDENTITY_LENGTH ||
    artwork.length > MAX_ARTWORK_LENGTH ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return NextResponse.json({ error: "提交内容过长，请精简后再试。" }, { status: 400 });
  }

  try {
    const receivedAt = new Date(now).toISOString();

    await sendInquiryEmail(
      {
        name,
        email,
        organization,
        identity,
        artwork,
        message,
      },
      {
        ip,
        userAgent: request.headers.get("user-agent")?.trim() || "",
        pageUrl: getRequestOrigin(request),
        receivedAt,
      },
    );

    return NextResponse.json({
      success: true,
      receivedAt,
    });
  } catch (error) {
    if (isInquiryConfigError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Inquiry delivery failed", error);
    return NextResponse.json({ error: "提交失败，请稍后再试，或直接发送邮件至 contact@zhujinju.com。" }, { status: 500 });
  }
}
