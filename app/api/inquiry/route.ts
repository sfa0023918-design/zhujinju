import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    message?: string;
    organization?: string;
    identity?: string;
    artwork?: string;
  };

  if (!body.name || !body.email || !body.message) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    receivedAt: new Date().toISOString(),
  });
}
